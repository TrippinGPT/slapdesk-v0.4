/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BeatData, NoteEvent, ReferenceDNA, SampleKit, StudioKitLane, TrackType } from '../types';
import { midiToFrequency } from './scales';
import { MIDI_PERC } from './drumsEngine';
import { clampTrackPan, isTrackAudible, trackGain } from './playbackMix';
import { swingOffsetSeconds } from './playbackTiming';
import { DEFAULT_808_ROOT_MIDI, samplePlaybackRate } from './samplePitch';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterVolume = 0.85;
  private compressor: DynamicsCompressorNode | null = null;
  private isPlaying: boolean = false;
  private currentStep: number = 0; // 0..127
  private tempo: number = 100;
  private schedulerTimer: number | null = null;
  private playheadTimers = new Set<number>();
  private activeSources = new Set<AudioScheduledSourceNode>();
  private transportGeneration = 0;
  private nextStepTime: number = 0;
  private currentBeatData: BeatData | null = null;
  private customKit: SampleKit = {};
  private studioSampleBuffers = new Map<string, AudioBuffer>();
  private studioLaneAssetIds: Partial<Record<StudioKitLane, string>> = {};
  private studio808RootMidi = DEFAULT_808_ROOT_MIDI;
  private previewSources = new Set<AudioScheduledSourceNode>();
  private capturingPreview = false;
  private trackPanners = new Map<TrackType, StereoPannerNode>();
  private onStepCallback: ((step: number, bar: number) => void) | null = null;
  private onPlayStateChange: ((playing: boolean) => void) | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Limiter / Compressor for punch and safe levels
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setCallbacks(
    onStep: (step: number, bar: number) => void,
    onStateChange: (playing: boolean) => void
  ) {
    this.onStepCallback = onStep;
    this.onPlayStateChange = onStateChange;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1.5, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public previewInstrument(track: TrackType, pitch = 60, duration = 0.4) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    switch (track) {
      case 'kick':
        this.playKick(now, 0.95, track);
        break;
      case 'snare':
        this.playClap(now, 0.9, track);
        break;
      case 'hihat':
        this.playHat(now, false, 0.85, track);
        break;
      case 'bass808':
        this.play808(now, pitch > 0 ? pitch : 36, duration, 0.95, undefined, track);
        break;
      case 'keys':
        this.playKeysNote(now, pitch > 0 ? pitch : 60, duration, 0.85, track);
        break;
      case 'melody':
        this.playMelodyNote(now, pitch > 0 ? pitch : 72, duration, 0.9, track);
        break;
    }
  }

  public setCustomSample(type: keyof SampleKit, buffer: AudioBuffer | undefined) {
    if (buffer) this.customKit[type] = buffer;
    else delete this.customKit[type];
    delete this.studioLaneAssetIds[type];
  }

  public clearCustomSamples() {
    this.customKit = {};
    this.studioLaneAssetIds = {};
    this.studioSampleBuffers.clear();
    this.studio808RootMidi = DEFAULT_808_ROOT_MIDI;
  }

  public getCustomSamples(): SampleKit {
    return this.customKit;
  }

  public clearStudioSamples() {
    this.customKit = {};
    this.studioLaneAssetIds = {};
    this.studio808RootMidi = DEFAULT_808_ROOT_MIDI;
    this.stopStudioAudition();
  }

  public setStudioSample(lane: StudioKitLane, id: string | undefined, buffer: AudioBuffer | undefined, rootMidi = DEFAULT_808_ROOT_MIDI) {
    if (!id || !buffer) {
      delete this.studioLaneAssetIds[lane];
      delete this.customKit[lane];
      if (lane === 'bass808') this.studio808RootMidi = DEFAULT_808_ROOT_MIDI;
      this.stopStudioAudition();
      return;
    }
    if (this.studioLaneAssetIds[lane] !== id) this.stopStudioAudition();
    const cached = this.studioSampleBuffers.get(id) ?? buffer;
    this.studioSampleBuffers.set(id, cached);
    this.studioLaneAssetIds[lane] = id;
    this.customKit[lane] = cached;
    if (lane === 'bass808') this.studio808RootMidi = Math.max(0, Math.min(127, Math.round(rootMidi)));
  }

  public getStudioSampleBuffer(id: string): AudioBuffer | undefined {
    return this.studioSampleBuffers.get(id);
  }

  public retainStudioSampleIds(ids: ReadonlySet<string>) {
    for (const id of this.studioSampleBuffers.keys()) {
      if (ids.has(id)) continue;
      this.studioSampleBuffers.delete(id);
      for (const lane of Object.keys(this.studioLaneAssetIds) as StudioKitLane[]) {
        if (this.studioLaneAssetIds[lane] === id) {
          delete this.studioLaneAssetIds[lane];
          delete this.customKit[lane];
        }
      }
    }
  }

  public auditionStudioLane(lane: StudioKitLane, rootMidi = DEFAULT_808_ROOT_MIDI) {
    this.init();
    if (!this.ctx) return;
    this.stopStudioAudition();
    this.capturingPreview = true;
    const time = this.ctx.currentTime + 0.01;
    try {
      switch (lane) {
        case 'kick': this.playKick(time, 0.95, 'kick'); break;
        case 'snare': this.playSnare(time, 0.9, 'snare'); break;
        case 'clap': this.playClap(time, 0.9, 'snare'); break;
        case 'closedHat': this.playHat(time, false, 0.85, 'hihat'); break;
        case 'openHat': this.playHat(time, true, 0.85, 'hihat'); break;
        case 'percussion':
          if (this.customKit.percussion) this.playBuffer(this.customKit.percussion, time, 0.85, 1, 'hihat');
          else this.playHat(time, false, 0.85, 'hihat');
          break;
        case 'bass808': this.play808(time, rootMidi, 0.6, 0.95, undefined, 'bass808'); break;
      }
    } finally {
      this.capturingPreview = false;
    }
  }

  public stopStudioAudition() {
    for (const source of this.previewSources) {
      try { source.stop(); } catch { /* Preview may have ended already. */ }
    }
    this.previewSources.clear();
  }

  public play(beatData: BeatData, startStep = 0) {
    this.init();
    if (!this.ctx) return;

    this.cancelScheduledPlayback(true);

    this.currentBeatData = beatData;
    this.tempo = beatData.config.bpm;
    this.updateTrackPans(beatData);
    this.currentStep = startStep;
    this.isPlaying = true;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    if (this.onPlayStateChange) this.onPlayStateChange(true);
    this.scheduleLoop(this.transportGeneration);
  }

  public stop() {
    this.cancelScheduledPlayback(true);
    this.isPlaying = false;
    this.currentStep = 0;
    if (this.onPlayStateChange) this.onPlayStateChange(false);
    if (this.onStepCallback) this.onStepCallback(0, 0);
  }

  public pause() {
    this.cancelScheduledPlayback(true);
    this.isPlaying = false;
    if (this.onPlayStateChange) this.onPlayStateChange(false);
  }

  private cancelScheduledPlayback(stopVoices: boolean) {
    this.transportGeneration++;
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    for (const timer of this.playheadTimers) window.clearTimeout(timer);
    this.playheadTimers.clear();
    if (stopVoices) {
      for (const source of this.activeSources) {
        try { source.stop(); } catch { /* A source may have ended between scheduling and cancellation. */ }
      }
      this.activeSources.clear();
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setBeatData(beatData: BeatData) {
    this.currentBeatData = beatData;
    this.tempo = beatData.config.bpm;
    if (this.ctx) this.updateTrackPans(beatData);
  }

  private getTrackPanner(track: TrackType): StereoPannerNode | null {
    if (!this.ctx || !this.compressor) return null;
    let panner = this.trackPanners.get(track);
    if (!panner) {
      panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(clampTrackPan(this.currentBeatData?.tracks[track]?.pan), this.ctx.currentTime);
      panner.connect(this.compressor);
      this.trackPanners.set(track, panner);
    }
    return panner;
  }

  private updateTrackPans(beatData: BeatData) {
    if (!this.ctx) return;
    for (const [track, panner] of this.trackPanners) {
      panner.pan.setValueAtTime(clampTrackPan(beatData.tracks[track]?.pan), this.ctx.currentTime);
    }
  }

  private scheduleLoop = (generation = this.transportGeneration) => {
    if (generation !== this.transportGeneration || !this.isPlaying || !this.ctx || !this.currentBeatData) return;

    const secondsPerStep = (60 / this.tempo) / 4; // 16th note duration in seconds
    const scheduleAheadTime = 0.15; // Schedule 150ms ahead

    while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
      const stepToSchedule = this.currentStep;
      const bar = Math.floor(stepToSchedule / 16);
      const scheduledTime = this.nextStepTime;

      this.scheduleStep(stepToSchedule, scheduledTime);

      // Trigger UI callback synchronously or on frame
      const stepDurationMs = secondsPerStep * 1000;
      const delayMs = Math.max(0, (scheduledTime - this.ctx.currentTime) * 1000);
      const playheadTimer = window.setTimeout(() => {
        this.playheadTimers.delete(playheadTimer);
        if (generation === this.transportGeneration && this.isPlaying && this.onStepCallback) {
          this.onStepCallback(stepToSchedule, bar);
        }
      }, delayMs);
      this.playheadTimers.add(playheadTimer);

      this.nextStepTime += secondsPerStep;
      this.currentStep = (this.currentStep + 1) % 128; // 8 bars * 16 steps = 128
    }

    this.schedulerTimer = window.setTimeout(() => this.scheduleLoop(generation), 25);
  };

  private scheduleStep(step: number, time: number) {
    if (!this.currentBeatData || !this.ctx) return;
    const { tracks } = this.currentBeatData;
    const bar = Math.floor(step / 16);
    const swungTime = (track: TrackType) => time + swingOffsetSeconds(step, this.tempo, this.currentBeatData!.config.swing, track);

    const isTrackActive = (t: TrackType) => isTrackAudible(tracks, t, bar);
    const getTrackGain = (t: TrackType) => trackGain(tracks[t]);

    // 1. Kick
    if (isTrackActive('kick')) {
      const gain = getTrackGain('kick');
      const kickHits = tracks.kick.notes.filter(n => n.step === step);
      kickHits.forEach(n => this.playKick(swungTime('kick'), (n.velocity / 127) * gain, 'kick'));
    }

    // 2. Snare / Clap
    if (isTrackActive('snare')) {
      const gain = getTrackGain('snare');
      const snareHits = tracks.snare.notes.filter(n => n.step === step);
      snareHits.forEach(n => {
        const vel = (n.velocity / 127) * gain;
        if (n.pitch === MIDI_PERC.CLAP) {
          this.playClap(time, vel, 'snare');
        } else if (n.pitch === MIDI_PERC.RIM_SHOT && this.customKit.percussion) {
          this.playBuffer(this.customKit.percussion, time, vel, 1, 'snare');
        } else {
          this.playSnare(time, vel, 'snare');
        }
      });
    }

    // 3. Hi-Hats
    if (isTrackActive('hihat')) {
      const gain = getTrackGain('hihat');
      const hatHits = tracks.hihat.notes.filter(n => n.step === step);
      hatHits.forEach(n => {
        const velocity = (n.velocity / 127) * gain;
        if (n.pitch === MIDI_PERC.OPEN_HAT) this.playHat(swungTime('hihat'), true, velocity, 'hihat');
        else if (n.pitch === MIDI_PERC.CLOSED_HAT) this.playHat(swungTime('hihat'), false, velocity, 'hihat');
        else if (this.customKit.percussion) this.playBuffer(this.customKit.percussion, swungTime('hihat'), velocity, 1, 'hihat');
        else this.playHat(swungTime('hihat'), false, velocity, 'hihat');
      });
    }

    // 4. 808 Bass
    if (isTrackActive('bass808')) {
      const gain = getTrackGain('bass808');
      const bassHits = tracks.bass808.notes.filter(n => n.step === step);
      const stepDuration = (60 / this.tempo) / 4;
      bassHits.forEach(n => {
        this.play808(swungTime('bass808'), n.pitch, n.duration * stepDuration, (n.velocity / 127) * gain, n.glideTo, 'bass808');
      });
    }

    // 5. Melody
    if (isTrackActive('melody')) {
      const gain = getTrackGain('melody');
      const melodyHits = tracks.melody.notes.filter(n => n.step === step);
      const stepDuration = (60 / this.tempo) / 4;
      melodyHits.forEach(n => {
        this.playMelodyNote(swungTime('melody'), n.pitch, n.duration * stepDuration, (n.velocity / 127) * gain, 'melody');
      });
    }

    // 6. Keys / Stabs
    if (isTrackActive('keys')) {
      const gain = getTrackGain('keys');
      const keysHits = tracks.keys.notes.filter(n => n.step === step);
      const stepDuration = (60 / this.tempo) / 4;
      keysHits.forEach(n => {
        this.playKeysNote(swungTime('keys'), n.pitch, n.duration * stepDuration, (n.velocity / 127) * gain, 'keys');
      });
    }
  }

  // --- Instrument Synthesis & Sample Playback ---

  public playKick(time: number, velocity = 0.9, track: TrackType = 'kick') {
    if (!this.ctx || !this.compressor) return;

    if (this.customKit.kick) {
      this.playBuffer(this.customKit.kick, time, velocity * 1.0, 1, track);
      return;
    }

    // Synthetic West Coast Kick Knock
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Fast pitch sweep (punch knock)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    // Gain envelope
    gain.gain.setValueAtTime(velocity * 1.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(osc, osc, gain);

    osc.start(time);
    osc.stop(time + 0.23);
  }

  public playClap(time: number, velocity = 0.9, track: TrackType = 'snare') {
    if (!this.ctx || !this.compressor) return;

    const clapBuffer = this.customKit.clap ?? this.customKit.snare;
    if (clapBuffer) {
      this.playBuffer(clapBuffer, time, velocity * 0.95, 1, track);
      return;
    }

    // Multi-tap noise burst for slap clap crack
    const noiseBuffer = this.createNoiseBuffer(0.25);
    if (!noiseBuffer) return;

    const [t1, t2, t3] = [time, time + 0.012, time + 0.024];

    // Tap 1
    this.playNoiseTap(noiseBuffer, t1, 0.015, velocity * 0.4, track);
    // Tap 2
    this.playNoiseTap(noiseBuffer, t2, 0.015, velocity * 0.6, track);
    // Main tail
    this.playNoiseTap(noiseBuffer, t3, 0.18, velocity * 1.0, track);
  }

  private playNoiseTap(buffer: AudioBuffer, time: number, decay: number, gainVal: number, track: TrackType = 'snare') {
    if (!this.ctx || !this.compressor) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(src, src, filter, gain);

    src.start(time);
    src.stop(time + decay + 0.01);
  }

  public playSnare(time: number, velocity = 0.9, track: TrackType = 'snare') {
    if (!this.ctx || !this.compressor) return;

    if (this.customKit.snare) {
      this.playBuffer(this.customKit.snare, time, velocity, 1, track);
      return;
    }

    // Snare tone + noise
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(210, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.08);
    oscGain.gain.setValueAtTime(velocity * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(osc, osc, oscGain);
    osc.start(time);
    osc.stop(time + 0.13);

    const noiseBuffer = this.createNoiseBuffer(0.2);
    if (noiseBuffer) {
      this.playNoiseTap(noiseBuffer, time, 0.14, velocity * 0.85, track);
    }
  }

  public playHat(time: number, isOpen: boolean, velocity = 0.8, track: TrackType = 'hihat') {
    if (!this.ctx || !this.compressor) return;

    const customBuf = isOpen ? this.customKit.openHat : this.customKit.closedHat;
    if (customBuf) {
      this.playBuffer(customBuf, time, velocity * 0.85, 1, track);
      return;
    }

    const dur = isOpen ? 0.35 : 0.06;
    const noiseBuffer = this.createNoiseBuffer(dur);
    if (!noiseBuffer) return;

    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isOpen ? 7000 : 8500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * (isOpen ? 0.65 : 0.55), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(src, src, filter, gain);

    src.start(time);
    src.stop(time + dur + 0.01);
  }

  public play808(time: number, midiPitch: number, duration: number, velocity = 0.95, glideToPitch?: number, track: TrackType = 'bass808') {
    if (!this.ctx || !this.compressor) return;

    if (this.customKit.bass808) {
      const rootMidi = this.studio808RootMidi;
      const rate = samplePlaybackRate(midiPitch, rootMidi);
      this.playBuffer(this.customKit.bass808, time, velocity, rate, track, {
        duration, glideToPitch, rootMidi,
      });
      return;
    }

    // Heavy Sub Synthesizer with Saturation & Glide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const targetFreq = midiToFrequency(midiPitch);

    osc.type = 'sine';
    // Initial punch pitch dive (15ms click)
    osc.frequency.setValueAtTime(targetFreq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, time + 0.02);

    if (glideToPitch) {
      const glideFreq = midiToFrequency(glideToPitch);
      const glideStart = time + duration * 0.35;
      const glideEnd = time + duration * 0.85;
      osc.frequency.setValueAtTime(targetFreq, glideStart);
      osc.frequency.exponentialRampToValueAtTime(glideFreq, glideEnd);
    }

    // Waveshaping Overdrive for grit
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(18) as any;
    distortion.oversample = '2x';

    // Sub Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);

    const safeDuration = Math.max(0.1, duration);
    gain.gain.setValueAtTime(velocity * 0.95, time);
    gain.gain.setValueAtTime(velocity * 0.95, time + safeDuration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + safeDuration);

    osc.connect(distortion);
    distortion.connect(filter);
    filter.connect(gain);
    gain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(osc, osc, distortion, filter, gain);

    osc.start(time);
    osc.stop(time + safeDuration + 0.05);
  }

  public playMelodyNote(time: number, midiPitch: number, duration: number, velocity = 0.9, track: TrackType = 'melody') {
    if (!this.ctx || !this.compressor) return;

    // Dark Rhodes / Sinister Bell Synthesis (Carrier + Modulator FM)
    const freq = midiToFrequency(midiPitch);
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const carrierGain = this.ctx.createGain();

    carrier.type = 'sine';
    modulator.type = 'triangle';
    carrier.frequency.setValueAtTime(freq, time);
    modulator.frequency.setValueAtTime(freq * 2, time);

    modGain.gain.setValueAtTime(freq * 0.8, time);
    modGain.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.5);

    modulator.connect(carrier.frequency);

    const safeDur = Math.max(0.1, duration);
    carrierGain.gain.setValueAtTime(velocity * 0.45, time);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, time + safeDur * 1.2);

    carrier.connect(carrierGain);
    carrierGain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(carrier, carrier, modulator, modGain, carrierGain);

    carrier.start(time);
    modulator.start(time);
    carrier.stop(time + safeDur * 1.3);
    modulator.stop(time + safeDur * 1.3);
  }

  public playKeysNote(time: number, midiPitch: number, duration: number, velocity = 0.8, track: TrackType = 'keys') {
    if (!this.ctx || !this.compressor) return;

    const freq = midiToFrequency(midiPitch);
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.002, time); // slight detune

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);

    const safeDur = Math.max(0.1, duration);
    gain.gain.setValueAtTime(velocity * 0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + safeDur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(osc1, osc1, osc2, filter, gain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + safeDur + 0.05);
    osc2.stop(time + safeDur + 0.05);
  }

  private playBuffer(
    buffer: AudioBuffer,
    time: number,
    gainVal: number,
    playbackRate = 1.0,
    track: TrackType = 'kick',
    options: { duration?: number; glideToPitch?: number; rootMidi?: number } = {}
  ) {
    if (!this.ctx || !this.compressor) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.setValueAtTime(playbackRate, time);

    const gain = this.ctx.createGain();
    if (options.duration !== undefined) {
      const safeDuration = Math.max(0.025, options.duration);
      const fadeIn = Math.min(0.005, safeDuration / 4);
      const fadeOut = Math.min(0.02, safeDuration / 3);
      const stopTime = time + safeDuration;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(gainVal, time + fadeIn);
      if (options.glideToPitch !== undefined) {
        const rootMidi = options.rootMidi ?? this.studio808RootMidi;
        const glideStart = time + safeDuration * 0.35;
        const glideEnd = time + safeDuration * 0.85;
        src.playbackRate.setValueAtTime(playbackRate, glideStart);
        src.playbackRate.exponentialRampToValueAtTime(samplePlaybackRate(options.glideToPitch, rootMidi), glideEnd);
      }
      gain.gain.setValueAtTime(gainVal, Math.max(time + fadeIn, stopTime - fadeOut));
      gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
      src.stop(stopTime + 0.005);
    } else {
      gain.gain.setValueAtTime(gainVal, time);
    }

    src.connect(gain);
    gain.connect(this.getTrackPanner(track)!);
    this.releaseNodesWhenEnded(src, src, gain);

    src.start(time);
  }

  private releaseNodesWhenEnded(source: AudioScheduledSourceNode, ...nodes: AudioNode[]) {
    this.activeSources.add(source);
    if (this.capturingPreview) this.previewSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
      this.previewSources.delete(source);
      nodes.forEach(node => node.disconnect());
    };
  }

  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // --- Reference Mode Audio Analyzer ---

  public async analyzeReferenceAudio(file: File): Promise<ReferenceDNA> {
    this.init();
    if (!this.ctx) {
      throw new Error('Web Audio Context not available');
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const totalSamples = channelData.length;

    // 1. Calculate RMS energy & Peak
    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < totalSamples; i += 4) {
      const val = Math.abs(channelData[i]);
      if (val > peak) peak = val;
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / (totalSamples / 4));

    // 2. Low band sub-energy vs High band sizzle
    // Sub-sample analysis in chunks of 2048 samples (~46ms)
    const chunkSize = 2048;
    const chunks = Math.floor(totalSamples / chunkSize);
    let lowEnergies: number[] = [];
    let highEnergies: number[] = [];
    let silentChunks = 0;

    for (let c = 0; c < chunks; c++) {
      let chunkSum = 0;
      let diffSum = 0;
      const start = c * chunkSize;
      for (let i = 0; i < chunkSize - 1; i++) {
        const val = channelData[start + i];
        const nextVal = channelData[start + i + 1];
        chunkSum += val * val;
        diffSum += Math.abs(nextVal - val); // Proxy for high frequency energy
      }
      const chunkRms = Math.sqrt(chunkSum / chunkSize);
      if (chunkRms < 0.03) {
        silentChunks++;
      }
      lowEnergies.push(chunkRms);
      highEnergies.push(diffSum / chunkSize);
    }

    // 3. Transient onsets for Kick/808 and Hat activity
    let kickTransients = 0;
    let hatTransients = 0;
    for (let i = 1; i < lowEnergies.length; i++) {
      if (lowEnergies[i] - lowEnergies[i - 1] > 0.08) {
        kickTransients++;
      }
      if (highEnergies[i] - highEnergies[i - 1] > 0.02) {
        hatTransients++;
      }
    }

    const audioSeconds = totalSamples / sampleRate;
    const kicksPerSecond = audioSeconds > 0 ? kickTransients / audioSeconds : 1.5;
    const hatsPerSecond = audioSeconds > 0 ? hatTransients / audioSeconds : 4.0;

    // 4. Estimate BPM (target range 92 - 122 BPM)
    let estimatedBpm = 98;
    if (kicksPerSecond >= 1.2 && kicksPerSecond <= 3.5) {
      // Usually kick hits ~ 2 times per beat in half-time slap or 1 per beat
      const rawBpm = kicksPerSecond * 60;
      if (rawBpm >= 90 && rawBpm <= 125) {
        estimatedBpm = Math.round(rawBpm);
      } else if (rawBpm * 2 >= 90 && rawBpm * 2 <= 125) {
        estimatedBpm = Math.round(rawBpm * 2);
      } else if (rawBpm / 2 >= 90 && rawBpm / 2 <= 125) {
        estimatedBpm = Math.round(rawBpm / 2);
      }
    }

    const kickDensity = Math.min(100, Math.max(20, Math.round(kicksPerSecond * 30)));
    const hatActivity = Math.min(100, Math.max(25, Math.round(hatsPerSecond * 16)));
    const vocalSpace = Math.min(95, Math.max(30, Math.round((silentChunks / chunks) * 150)));
    const darkness = Math.min(95, Math.max(35, Math.round(75 - (hatActivity * 0.25))));
    const bass808Activity = Math.min(90, Math.max(30, Math.round(kickDensity * 0.9)));
    const syncopation = Math.min(95, Math.max(40, Math.round(55 + (kickTransients % 30))));
    const phraseRepetition = 80;
    const turnaroundSpace = Math.min(90, Math.max(40, vocalSpace + 10));

    return {
      sourceFileName: file.name,
      detectedBpm: estimatedBpm,
      kickDensity,
      bass808Activity,
      hatActivity,
      syncopation,
      phraseRepetition,
      turnaroundSpace,
      darkness,
      vocalSpace,
    };
  }

  // Normalizer: decodes buffer and returns a peak-normalized AudioBuffer
  public async decodeAndNormalizeSample(file: File): Promise<AudioBuffer> {
    return this.decodeAndNormalizeSampleData(await file.arrayBuffer());
  }

  public async decodeAndNormalizeSampleData(arrayBuf: ArrayBuffer): Promise<AudioBuffer> {
    this.init();
    if (!this.ctx) throw new Error('Web Audio not initialized');

    const rawBuffer = await this.ctx.decodeAudioData(arrayBuf.slice(0));

    // Find peak
    let maxPeak = 0;
    for (let c = 0; c < rawBuffer.numberOfChannels; c++) {
      const data = rawBuffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        const absVal = Math.abs(data[i]);
        if (absVal > maxPeak) maxPeak = absVal;
      }
    }

    if (maxPeak === 0 || maxPeak >= 0.98) {
      return rawBuffer; // already normalized or empty
    }

    // Scale to target -0.5 dB peak (0.94)
    const scaleFactor = 0.94 / maxPeak;
    const normalizedBuffer = this.ctx.createBuffer(
      rawBuffer.numberOfChannels,
      rawBuffer.length,
      rawBuffer.sampleRate
    );

    for (let c = 0; c < rawBuffer.numberOfChannels; c++) {
      const srcData = rawBuffer.getChannelData(c);
      const dstData = normalizedBuffer.getChannelData(c);
      for (let i = 0; i < srcData.length; i++) {
        dstData[i] = srcData[i] * scaleFactor;
      }
    }

    return normalizedBuffer;
  }
}

export const audioEngine = new AudioEngine();
