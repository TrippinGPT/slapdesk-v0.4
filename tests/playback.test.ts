import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clampTrackPan, isTrackAudible, trackGain } from '../src/engine/playbackMix';
import { scheduledStepTime, swingOffsetSeconds } from '../src/engine/playbackTiming';
import { createDefaultConfig, generateFullBeat } from '../src/engine/generator';
import { audioEngine } from '../src/engine/audioEngine';
import { recookBeat } from '../src/engine/recook';
import { BeatTrack, TrackType } from '../src/types';

const trackIds: TrackType[] = ['melody','keys','bass808','kick','snare','hihat'];
function tracks(): Record<TrackType, BeatTrack> {
  return Object.fromEntries(trackIds.map((id, channel) => [id, {
    id, name: id, channel, notes: [], muted: false, solo: false, volume: 1, pan: 0,
  }])) as Record<TrackType, BeatTrack>;
}

test('swing zero is straight timing, and swing delays only offbeat eighth subdivisions', () => {
  const bpm = 120, stepDuration = 60 / bpm / 4;
  for (let step = 0; step < 16; step++) {
    assert.equal(swingOffsetSeconds(step, bpm, 0, 'hihat'), 0);
    assert.equal(scheduledStepTime(12, step, bpm, 0), 12 + step * stepDuration);
    assert.equal(swingOffsetSeconds(step, bpm, 60, 'hihat') > 0, step % 4 === 2);
    assert.equal(swingOffsetSeconds(step, bpm, 60, 'snare'), 0);
  }
  assert.equal(swingOffsetSeconds(2, 120, 60, 'hihat'), stepDuration * 0.3);
  assert.equal(scheduledStepTime(0, 6, 120, 60, 'snare'), 0 + 6 * stepDuration);
});

test('swing has no accumulated drift over all eight bars and adapts to tempo', () => {
  for (const bpm of [72, 100, 137, 200]) {
    const barSeconds = 60 / bpm * 4;
    for (let bar = 0; bar < 8; bar++) {
      const start = 3.25 + bar * barSeconds;
      assert.equal(scheduledStepTime(start, 0, bpm, 80), start);
      assert.ok(Math.abs((scheduledStepTime(start, 14, bpm, 80) - start) -
        (14 * (60 / bpm / 4) + swingOffsetSeconds(14, bpm, 80, 'hihat'))) < 1e-12);
    }
    assert.ok(Math.abs((3.25 + 8 * barSeconds) - (3.25 + 8 * (60 / bpm * 4))) < 1e-12);
  }
});

test('repeated swing scheduling produces identical times and leaves fixed anchors straight', () => {
  const bpm = 113, swing = 47, barSeconds = 60 / bpm * 4;
  const schedule = () => Array.from({ length: 128 }, (_, step) => {
    const barStart = 2 + Math.floor(step / 16) * barSeconds;
    return {
      hat: scheduledStepTime(barStart, step % 16, bpm, swing, 'hihat'),
      snare: scheduledStepTime(barStart, step % 16, bpm, swing, 'snare'),
    };
  });
  assert.deepEqual(schedule(), schedule());
  const scheduled = schedule();
  for (let step = 0; step < 128; step++) {
    const item = scheduled[step];
    const straight = 2 + step * (60 / bpm / 4);
    assert.ok(Math.abs(item.snare - straight) < 1e-12);
  }
});

test('track pan clamps to stereo bounds and track volume remains an independent gain', () => {
  assert.equal(clampTrackPan(-1), -1);
  assert.equal(clampTrackPan(0), 0);
  assert.equal(clampTrackPan(1), 1);
  assert.equal(clampTrackPan(-2), -1);
  assert.equal(clampTrackPan(2), 1);
  assert.equal(trackGain({ ...tracks().kick, volume: 0.37 }), 0.37);
  assert.equal(trackGain({ ...tracks().kick, volume: 0 }), 0);
  assert.equal(trackGain({ ...tracks().kick, volume: 1 }), 1);
  assert.equal(trackGain({ ...tracks().kick, volume: 1.5 }), 1.5);
});

test('mute, solo, disabled bars and conflicting mute+solo follow mixer priority', () => {
  const mix = tracks();
  assert.equal(isTrackAudible(mix, 'kick', 0), true);
  assert.ok(trackIds.every(id => isTrackAudible(mix, id, 0)), 'all unmuted tracks play');
  mix.kick.solo = true;
  mix.snare.solo = true;
  assert.equal(isTrackAudible(mix, 'kick', 0), true);
  assert.equal(isTrackAudible(mix, 'snare', 0), true, 'multiple soloed tracks play together');
  assert.equal(isTrackAudible(mix, 'hihat', 0), false);
  mix.kick.solo = false;
  mix.snare.solo = false;
  mix.kick.muted = true;
  mix.snare.solo = true;
  assert.equal(isTrackAudible(mix, 'kick', 0), false, 'mute takes priority over solo');
  assert.equal(isTrackAudible(mix, 'snare', 0), true);
  assert.equal(isTrackAudible(mix, 'hihat', 0), false, 'other tracks are silenced while solo is active');
  mix.snare.disabledBars = [3];
  assert.equal(isTrackAudible(mix, 'snare', 3), false);
  mix.kick.muted = false;
  mix.kick.enabled = false;
  mix.snare.solo = false;
  assert.equal(isTrackAudible(mix, 'kick', 0), false, 'disabled tracks remain silent');
  mix.kick.enabled = true;
  mix.snare.muted = true;
  assert.equal(isTrackAudible(mix, 'snare', 0), false, 'a soloed and muted track remains silent');
});

class Param {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
}
class Node {
  connections: Node[] = [];
  gain = new Param(); pan = new Param(); frequency = new Param(); Q = new Param(); playbackRate = new Param();
  threshold = new Param(); knee = new Param(); ratio = new Param(); attack = new Param(); release = new Param();
  type = ''; buffer: any; curve: any; oversample = '';
  onended: (() => void) | null = null;
  stopCalls = 0;
  connect(node: Node) { this.connections.push(node); }
  start() {}
  stop() { this.stopCalls++; }
  disconnect() {}
}
class FakeAudioContext {
  static instance: FakeAudioContext;
  static created = 0;
  currentTime = 10; sampleRate = 44100; state = 'running'; destination = new Node();
  panners: Node[] = [];
  sources: Node[] = [];
  constructor() { FakeAudioContext.instance = this; FakeAudioContext.created++; }
  createDynamicsCompressor() { return new Node(); }
  createGain() { return new Node(); }
  createStereoPanner() { const node = new Node(); this.panners.push(node); return node; }
  createOscillator() { const node = new Node(); this.sources.push(node); return node; }
  createBiquadFilter() { return new Node(); }
  createWaveShaper() { return new Node(); }
  createBufferSource() { const node = new Node(); this.sources.push(node); return node; }
  createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
  resume() {}
}

test('Web Audio routes through persistent panners and cancels stale transport work', () => {
  let nextTimer = 1;
  const pendingTimers = new Map<number, () => void>();
  (globalThis as any).window = {
    AudioContext: FakeAudioContext,
    setTimeout: (callback: () => void) => { const id = nextTimer++; pendingTimers.set(id, callback); return id; },
    clearTimeout: (id: number) => { pendingTimers.delete(id); },
  };
  const beat = generateFullBeat(createDefaultConfig(551122));
  for (const [index, id] of trackIds.entries()) beat.tracks[id].pan = index / 2 - 1;
  beat.tracks.melody.pan = -1;
  beat.tracks.kick.notes = [{ step: 0, bar: 0, stepInBar: 0, pitch: 36, duration: 1, velocity: 100 }];
  audioEngine.setBeatData(beat);
  audioEngine.previewInstrument('melody');
  const context = FakeAudioContext.instance;
  const melodyPanner = context.panners[0];
  assert.equal(melodyPanner.pan.value, -1);
  assert.equal(melodyPanner.connections.length, 1, 'panner routes to the shared compressor');

  beat.tracks.melody.pan = 0;
  audioEngine.setBeatData(beat);
  assert.equal(melodyPanner.pan.value, 0);
  beat.tracks.melody.pan = 1;
  audioEngine.setBeatData(beat);
  assert.equal(melodyPanner.pan.value, 1);
  audioEngine.previewInstrument('melody');
  assert.equal(context.panners.length, 1, 'notes reuse the existing track panner');
  assert.equal(melodyPanner.connections[0], (audioEngine as any).compressor);
  assert.ok(melodyPanner.connections[0].connections.includes((audioEngine as any).masterGain));
  for (const id of trackIds.filter(id => id !== 'melody')) audioEngine.previewInstrument(id);
  assert.equal(context.panners.length, trackIds.length, 'one persistent panner per track');
  for (const [index, id] of trackIds.entries()) {
    assert.equal(context.panners[index].pan.value, id === 'melody' ? 1 : clampTrackPan(index / 2 - 1), `${id} pan`);
    assert.equal(context.panners[index].connections.length, 1);
  }

  const priorKickSample = audioEngine.getCustomSamples().kick;
  const kickBuffer = {} as AudioBuffer;
  audioEngine.setCustomSample('kick', kickBuffer);
  audioEngine.playKick(context.currentTime, 0.8);
  const sampleSource = context.sources.at(-1)!;
  assert.equal(sampleSource.buffer, kickBuffer);
  assert.equal(sampleSource.connections[0].connections[0], context.panners[trackIds.indexOf('kick')],
    'sample buffer playback passes through the kick panner');
  sampleSource.stop();
  sampleSource.onended?.();
  audioEngine.setCustomSample('kick', priorKickSample);

  let playheadEvents = 0;
  audioEngine.setCallbacks(() => { playheadEvents++; }, () => {});
  audioEngine.play(beat);
  const staleTimers = [...pendingTimers.values()];
  const voicesBeforeRestart: Node[] = [...(audioEngine as any).activeSources];
  assert.ok(voicesBeforeRestart.length > 0, 'playback has scheduled audio sources');
  audioEngine.play(beat, 16);
  assert.ok(voicesBeforeRestart.every(source => source.stopCalls >= 2), 'restart stops voices from the previous transport');
  staleTimers.forEach(callback => callback());
  assert.equal(playheadEvents, 0, 'cancelled transport callbacks cannot update a restarted playhead');
  assert.ok(pendingTimers.size > 0, 'the restarted transport has only its current timers');
  audioEngine.pause();
  assert.equal(pendingTimers.size, 0, 'pause clears scheduler and playhead timers');

  const panDuringPlayback = -0.65;
  audioEngine.play(beat);
  beat.tracks.melody.pan = panDuringPlayback;
  audioEngine.setBeatData(beat);
  assert.equal(melodyPanner.pan.value, panDuringPlayback);
  audioEngine.stop();
  assert.equal(pendingTimers.size, 0, 'stop clears scheduler and playhead timers');
  assert.equal(FakeAudioContext.created, 1, 'the singleton AudioContext is reused');
});

test('pan and volume survive every targeted recook', () => {
  const before = generateFullBeat(createDefaultConfig(19831));
  for (const [index, id] of trackIds.entries()) {
    before.tracks[id].pan = -1 + index * 0.4;
    before.tracks[id].volume = index / 5;
  }
  for (const target of ['drums', '808', 'music'] as const) {
    const after = recookBeat(before, target);
    for (const id of trackIds) {
      assert.equal(after.tracks[id].pan, before.tracks[id].pan);
      assert.equal(after.tracks[id].volume, before.tracks[id].volume);
    }
  }
});
