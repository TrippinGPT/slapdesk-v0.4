import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDefaultConfig, generateFullBeat } from '../src/engine/generator';
import { generateDrumMidi, generateMidiFile, generateMusicMidi, generateSingleTrackMidi, PPQ } from '../src/engine/midiWriter';
import { scheduledStepTime, swingOffsetTicks } from '../src/engine/playbackTiming';
import { BeatData, TrackType } from '../src/types';

type ParsedEvent = { tick: number; status: number; data: number[] };
type ParsedTrack = { name: string; events: ParsedEvent[] };

function parseMidi(bytes: Uint8Array): { format: number; ppq: number; tracks: ParsedTrack[] } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const str = (at: number, length: number) => String.fromCharCode(...bytes.slice(at, at + length));
  assert.equal(str(0, 4), 'MThd');
  assert.equal(view.getUint32(4), 6);
  const format = view.getUint16(8), trackCount = view.getUint16(10), ppq = view.getUint16(12);
  let pos = 14;
  const tracks: ParsedTrack[] = [];
  const readVlq = (end: number) => {
    let value = 0, byte = 0, count = 0;
    do {
      assert.ok(pos < end, 'valid VLQ bytes');
      byte = bytes[pos++]; value = (value << 7) | (byte & 127);
      assert.ok(++count <= 4, 'VLQ does not exceed four bytes');
    } while (byte & 128);
    return value;
  };
  for (let t = 0; t < trackCount; t++) {
    assert.equal(str(pos, 4), 'MTrk');
    const trackEnd = pos + 8 + view.getUint32(pos + 4);
    pos += 8;
    let tick = 0, name = '', eot = false;
    const events: ParsedEvent[] = [];
    while (pos < trackEnd) {
      const delta = readVlq(trackEnd);
      assert.ok(delta >= 0);
      tick += delta;
      const status = bytes[pos++];
      if (status === 0xff) {
        const type = bytes[pos++], length = readVlq(trackEnd);
        const payload = bytes.slice(pos, pos + length); pos += length;
        if (type === 0x03) name = String.fromCharCode(...payload);
        if (type === 0x2f) eot = true;
      } else {
        const kind = status >> 4;
        const length = kind === 0xc || kind === 0xd ? 1 : 2;
        const data = Array.from(bytes.slice(pos, pos + length)); pos += length;
        events.push({ tick, status, data });
      }
      assert.ok(pos <= trackEnd, 'event stays inside its track chunk');
    }
    assert.equal(pos, trackEnd);
    assert.ok(eot, 'track has an end marker');
    tracks.push({ name, events });
  }
  assert.equal(pos, bytes.length);
  return { format, ppq, tracks };
}

function noteOns(track: ParsedTrack) {
  return track.events.filter(event => (event.status >> 4) === 0x9 && event.data[1] > 0);
}

function notesFor(parsed: ReturnType<typeof parseMidi>, name: string) {
  return parsed.tracks.find(track => track.name === name)!;
}

function beatFixture(): BeatData {
  const beat = generateFullBeat({ ...createDefaultConfig(88421), swing: 0 });
  for (const id of Object.keys(beat.tracks) as TrackType[]) {
    beat.tracks[id].muted = false;
    beat.tracks[id].enabled = true;
    beat.tracks[id].disabledBars = [];
  }
  return beat;
}

test('active full arrangement serializes every note with stable names, Type 1, tempo track and 480 PPQ', () => {
  const beat = beatFixture();
  const parsed = parseMidi(generateMidiFile(beat));
  const expectedCount = Object.values(beat.tracks).reduce((sum, track) => sum + track.notes.length, 0);
  assert.equal(parsed.format, 1);
  assert.equal(parsed.ppq, PPQ);
  assert.equal(parsed.tracks.length, 7);
  assert.equal(parsed.tracks.slice(1).reduce((sum, track) => sum + noteOns(track).length, 0), expectedCount);
  for (const track of Object.values(beat.tracks)) {
    assert.ok(track.name.length > 0);
    assert.ok(!/^Track \d+$/i.test(track.name));
    assert.equal(noteOns(notesFor(parsed, track.name)).length, track.notes.length);
  }
  const midiBytes = generateMidiFile(beat);
  assert.ok(midiBytes.some((byte, index) => byte === 0xff && midiBytes[index + 1] === 0x51), 'contains a tempo event');
  assert.ok(midiBytes.some((byte, index) => byte === 0xff && midiBytes[index + 1] === 0x58), 'contains 4/4 time signature');
});

test('arrangement bar mutes, track mute and disable are export filters and never mutate source events', () => {
  const beat = beatFixture();
  const kick = beat.tracks.kick;
  kick.notes = Array.from({ length: 8 }, (_, bar) => ({
    step: bar * 16, bar, stepInBar: 0, pitch: 36, duration: 1, velocity: 100,
  }));
  const original = structuredClone(kick.notes);
  kick.disabledBars = [2, 6];
  let parsed = parseMidi(generateMidiFile(beat));
  assert.equal(noteOns(notesFor(parsed, kick.name)).length, 6, 'muted sections have no events');
  assert.deepEqual(kick.notes, original, 'export does not delete or rewrite generator events');

  kick.disabledBars = [];
  parsed = parseMidi(generateMidiFile(beat));
  assert.equal(noteOns(notesFor(parsed, kick.name)).length, 8, 'unmuting restores events without regeneration');
  kick.muted = true;
  assert.equal(noteOns(notesFor(parseMidi(generateMidiFile(beat)), kick.name)).length, 0);
  kick.muted = false;
  kick.enabled = false;
  assert.equal(noteOns(notesFor(parseMidi(generateMidiFile(beat)), kick.name)).length, 0);
  kick.enabled = true;
  assert.equal(noteOns(notesFor(parseMidi(generateMidiFile(beat)), kick.name)).length, 8);
});

test('muting one lane leaves unrelated tracks unchanged; group exports include their intended tracks only', () => {
  const beat = beatFixture();
  const before = parseMidi(generateMidiFile(beat));
  const beforeCounts = Object.fromEntries(before.tracks.slice(1).map(track => [track.name, noteOns(track).length]));
  beat.tracks.kick.disabledBars = [0, 1, 2, 3, 4, 5, 6, 7];
  const after = parseMidi(generateMidiFile(beat));
  assert.equal(noteOns(notesFor(after, beat.tracks.kick.name)).length, 0);
  for (const id of ['melody', 'keys', 'bass808', 'snare', 'hihat'] as const) {
    assert.equal(noteOns(notesFor(after, beat.tracks[id].name)).length, beforeCounts[beat.tracks[id].name]);
  }

  const music = parseMidi(generateMusicMidi(beat));
  assert.deepEqual(new Set(music.tracks.slice(1).map(track => track.name)),
    new Set([beat.tracks.melody.name, beat.tracks.keys.name]));
  const drums = parseMidi(generateDrumMidi(beat));
  assert.deepEqual(new Set(drums.tracks.slice(1).map(track => track.name)),
    new Set([beat.tracks.kick.name, beat.tracks.snare.name, beat.tracks.hihat.name]));
  assert.ok(!drums.tracks.some(track => track.name === beat.tracks.bass808.name), '808 remains separate');
  assert.equal(noteOns(notesFor(drums, beat.tracks.kick.name)).length, 0, 'arrangement filter also applies to drum group');
  beat.tracks.keys.disabledBars = Array.from({ length: 8 }, (_, bar) => bar);
  const musicAfterMute = parseMidi(generateMusicMidi(beat));
  assert.equal(noteOns(notesFor(musicAfterMute, beat.tracks.keys.name)).length, 0,
    'arrangement filtering also applies to Music MIDI');
  assert.ok(noteOns(notesFor(musicAfterMute, beat.tracks.melody.name)).length > 0,
    'unmuted music track remains in Music MIDI');
  beat.tracks.bass808.enabled = false;
  assert.equal(noteOns(parseMidi(generateSingleTrackMidi(beat.tracks.bass808, beat.config.bpm, beat.config.swing))
    .tracks[1]).length, 0, 'track disable also filters a separate 808 stem');
});

test('swing zero preserves straight MIDI timing and repeated exports are byte-identical', () => {
  const beat = beatFixture();
  beat.config.swing = 0;
  const first = generateMidiFile(beat), second = generateMidiFile(beat);
  assert.deepEqual(first, second);
  const parsed = parseMidi(first);
  for (const track of Object.values(beat.tracks)) {
    const starts = noteOns(notesFor(parsed, track.name));
    assert.deepEqual(starts.map(event => event.tick), track.notes.map(note => Math.max(0,
      Math.round(note.step * 120 + (note.microtiming ?? 0)))).sort((a, b) => a - b));
  }
});

test('swing moves only shared designated subdivisions, keeps anchors and bar boundaries, and stays deterministic', () => {
  const beat = beatFixture();
  beat.config.bpm = 120;
  beat.config.swing = 50;
  for (const id of ['kick', 'snare', 'hihat'] as const) {
    beat.tracks[id].notes = Array.from({ length: 64 }, (_, ix) => {
      const bar = Math.floor(ix / 8), stepInBar = (ix % 8) * 2;
      return { step: bar * 16 + stepInBar, bar, stepInBar, pitch: id === 'snare' ? 39 : 42,
        duration: 2, velocity: 90 };
    });
  }
  const original = structuredClone(beat.tracks);
  const bytesA = generateMidiFile(beat), bytesB = generateMidiFile(beat);
  assert.deepEqual(bytesA, bytesB);
  assert.deepEqual(beat.tracks, original, 'swing serialization does not mutate source lanes');
  const parsed = parseMidi(bytesA);
  const stepDuration = 60 / beat.config.bpm / 4;
  for (const id of ['kick', 'hihat'] as const) {
    const actual = noteOns(notesFor(parsed, beat.tracks[id].name));
    for (let bar = 0; bar < 8; bar++) for (let step = 0; step < 16; step += 2) {
      const index = bar * 8 + step / 2;
      const expected = bar * 16 * 120 + step * 120 + swingOffsetTicks(step, beat.config.bpm, 50, id);
      assert.equal(actual[index].tick, expected);
      const barStartSeconds = bar * 4 * (60 / beat.config.bpm);
      const secondsFromPlayback = scheduledStepTime(barStartSeconds, step, beat.config.bpm, 50, id) - barStartSeconds;
      const playbackTickOffset = secondsFromPlayback * beat.config.bpm / 60 * PPQ;
      assert.ok(Math.abs(playbackTickOffset - (step * 120 + swingOffsetTicks(step, beat.config.bpm, 50, id))) < 1e-9,
        `tick transform follows playback timing at bar ${bar + 1}, step ${step}`);
      if (step === 0) assert.equal(actual[index].tick, bar * 1920, 'bar starts remain exact with no drift');
    }
  }
  const fixed = noteOns(notesFor(parsed, beat.tracks.snare.name));
  assert.deepEqual(fixed.map(event => event.tick), beat.tracks.snare.notes.map(note => note.step * 120));
  assert.equal(swingOffsetTicks(2, 120, 50, 'hihat'), 30, '50% swing is 30 ticks at 480 PPQ');
  assert.equal(swingOffsetTicks(2, 120, 50, 'snare'), 0, 'snare anchors stay fixed');
  assert.ok(Math.abs((stepDuration * 0.25) * beat.config.bpm / 60 * PPQ - 30) < 1e-9);
  for (const bpm of [72, 100, 137, 200]) {
    const playbackOffset = scheduledStepTime(0, 2, bpm, 50, 'hihat') - 2 * (60 / bpm / 4);
    assert.equal(Math.round(playbackOffset * bpm / 60 * PPQ), swingOffsetTicks(2, bpm, 50, 'hihat'));
    assert.equal(swingOffsetTicks(2, bpm, 50, 'hihat'), 30, 'tick placement is tempo-safe at 480 PPQ');
  }
});

test('MIDI preserves velocity and duration while swinging the note start only', () => {
  const beat = beatFixture();
  beat.config.bpm = 100;
  beat.config.swing = 50;
  const kick = beat.tracks.kick;
  kick.notes = [{ step: 2, bar: 0, stepInBar: 2, pitch: 36, duration: 2, velocity: 73 }];
  const track = notesFor(parseMidi(generateMidiFile(beat)), kick.name);
  const on = track.events.find(event => (event.status >> 4) === 0x9)!;
  const off = track.events.find(event => (event.status >> 4) === 0x8)!;
  assert.equal(on.tick, 270);
  assert.equal(on.data[1], 73);
  assert.equal(off.tick - on.tick, 240, 'swing does not shorten or lengthen the note');
});

test('serialized notes have positive durations and paired note-ons/note-offs', () => {
  const beat = beatFixture();
  beat.config.swing = 93;
  const parsed = parseMidi(generateMidiFile(beat));
  for (const track of parsed.tracks.slice(1)) {
    const active = new Map<string, number[]>();
    for (const event of track.events) {
      const kind = event.status >> 4;
      if (kind !== 0x8 && kind !== 0x9) continue;
      const pitch = event.data[0], key = `${event.status & 15}/${pitch}`;
      if (kind === 0x9 && event.data[1] > 0) {
        const queue = active.get(key) ?? [];
        queue.push(event.tick); active.set(key, queue);
      } else {
        const queue = active.get(key) ?? [];
        const start = queue.shift();
        assert.notEqual(start, undefined, 'note-off has a corresponding note-on');
        assert.ok(event.tick > start!, 'note duration remains positive after swing');
      }
    }
    assert.ok([...active.values()].every(queue => queue.length === 0), 'no hanging note-on events');
  }
});
