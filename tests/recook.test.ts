import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDefaultConfig, generateFullBeat } from '../src/engine/generator';
import { recookBeat, RECOOK_TRACKS } from '../src/engine/recook';
import { audioEngine } from '../src/engine/audioEngine';
import { CURATED_REFERENCE_TARGETS } from '../src/engine/referenceLibrary';
import { BeatData, BeatTrack, RecookTarget, SampleKit, TrackType } from '../src/types';

const targets: RecookTarget[] = ['music', 'drums', '808'];
const trackIds: TrackType[] = ['melody', 'keys', 'bass808', 'kick', 'snare', 'hihat'];
function settings({ notes, ...rest }: BeatTrack) { return rest; }
function freeze(value: any): any {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function fixture(variation: 'V1' | 'V2' | 'V3' = 'V1', reference = false): BeatData {
  const beat = generateFullBeat({ ...createDefaultConfig(123456), variation }, reference ? CURATED_REFERENCE_TARGETS[0] : undefined);
  // Preserve actual session controls even when they no longer match reference defaults.
  beat.config = { ...beat.config, bpm: 113, swing: 37, darkness: 71, vocalSpace: 61 };
  for (const [index, id] of trackIds.entries()) {
    Object.assign(beat.tracks[id], {
      name: `User label ${id}`, muted: index % 2 === 0, solo: index % 3 === 0,
      volume: index === 0 ? 0 : 0.25 + index / 10, pan: -1 + index / 5,
      disabledBars: [1, 7], color: `#00000${index}`,
      // Deliberate extension sentinels, not newly implemented application features.
      enabled: false, sampleAssignment: { assetId: `${id}.wav`, rootPitch: 24 },
      keep: true, starred: true, ui: { zoom: 2, selectedBar: 3 },
    });
    beat.tracks[id].notes = beat.tracks[id].notes.map(n => ({ ...n, velocity: 43 }));
  }
  Object.assign(beat, { presetSelection: 'saved-preset', regionalStyle: 'Bay', arrangement: { section: 'verse' } });
  return beat;
}

for (const target of targets) for (const variation of ['V1', 'V2', 'V3'] as const) {
  test(`${target} ${variation}: replace target events only; preserve settings, selection and metadata`, () => {
    const before = freeze(fixture(variation, true));
    const snapshot = structuredClone(before);
    const after = recookBeat(before, target);
    const changed = RECOOK_TRACKS[target];
    for (const id of trackIds) {
      assert.deepEqual(settings(after.tracks[id]), settings(before.tracks[id]), id);
      assert.equal(after.tracks[id].disabledBars, before.tracks[id].disabledBars);
      if (changed.includes(id)) {
        assert.notEqual(after.tracks[id], before.tracks[id]);
        assert.notDeepEqual(after.tracks[id].notes, before.tracks[id].notes, `${id} must change`);
      } else assert.equal(after.tracks[id], before.tracks[id], `${id} must retain its object and events`);
    }
    assert.equal(after.config, before.config);
    assert.equal(after.referenceDNA, before.referenceDNA);
    assert.equal(after.barStructure, before.barStructure);
    const { tracks: _t, recookCounts: _r, melodyQuality: _q, melodyMotifName: _m, melodyPersonalityName: _p, ...retained } = after;
    const { tracks: _ot, recookCounts: _or, melodyQuality: _oq, melodyMotifName: _om, melodyPersonalityName: _op, ...original } = before;
    assert.deepEqual(retained, original);
    if (target !== 'music') {
      assert.equal(after.melodyQuality, before.melodyQuality);
      assert.equal(after.melodyMotifName, before.melodyMotifName);
      assert.equal(after.melodyPersonalityName, before.melodyPersonalityName);
    }
    assert.deepEqual(before, snapshot, 'input must not be mutated');
    assert.deepEqual(after.recookCounts, { [target]: 1 });
    assert.deepEqual(recookBeat(before, target), after, 'same history is reproducible');
  });
}

test('every click changes each nonempty target lane, including untouched generated cookups', () => {
  for (const target of targets) {
    let beat = generateFullBeat(createDefaultConfig(246810));
    for (let revision = 1; revision <= 15; revision++) {
      const next = recookBeat(beat, target);
      for (const id of RECOOK_TRACKS[target]) {
        assert.notDeepEqual(next.tracks[id].notes, beat.tracks[id].notes, `${target}/${id}/${revision}`);
        for (const note of next.tracks[id].notes) {
          assert.equal(note.step, note.bar * 16 + note.stepInBar);
          assert.ok(note.step >= 0 && note.step < 128);
          assert.ok(note.velocity > 0 && note.velocity <= 127);
        }
      }
      assert.equal(next.recookCounts?.[target], revision);
      beat = next;
    }
  }
});

test('lane histories are independent and survive a serialized session', () => {
  const original = fixture();
  const drumThenBass = recookBeat(recookBeat(original, 'drums'), '808');
  const bassThenDrum = recookBeat(recookBeat(original, '808'), 'drums');
  assert.deepEqual(drumThenBass, bassThenDrum);
  const resumed = JSON.parse(JSON.stringify(drumThenBass));
  // JSON drops optional undefined properties; compare the serialized payloads.
  assert.deepEqual(recookBeat(resumed, 'music'), JSON.parse(JSON.stringify(recookBeat(drumThenBass, 'music'))));
});

test('sample buffers and assignments remain in the existing AudioEngine singleton', () => {
  const previous = { ...audioEngine.getCustomSamples() };
  const slots: (keyof SampleKit)[] = ['kick','snare','closedHat','openHat','bass808'];
  try {
    for (const slot of slots) audioEngine.setCustomSample(slot, { testSlot: slot } as unknown as AudioBuffer);
    const kit = audioEngine.getCustomSamples();
    const buffers = { ...kit };
    let beat = fixture();
    for (const target of targets) {
      beat = recookBeat(beat, target);
      audioEngine.setBeatData(beat);
      assert.equal(audioEngine.getCustomSamples(), kit);
      for (const slot of slots) assert.equal(kit[slot], buffers[slot]);
    }
  } finally {
    for (const slot of slots) audioEngine.setCustomSample(slot, previous[slot]);
  }
});

test('intentional keys silence and disabled bars are retained', () => {
  const beat = generateFullBeat({ ...createDefaultConfig(123456), vocalSpace: 100 });
  beat.tracks.keys.disabledBars = [0,1,2,3,4,5,6,7];
  const after = recookBeat(beat, 'music');
  assert.deepEqual(after.tracks.keys.notes, []);
  assert.equal(after.tracks.keys.disabledBars, beat.tracks.keys.disabledBars);
});

test('V1/V2/V3 share the complete core motif and retain bar-five home return after recooks', () => {
  for (let i = 0; i < 100; i++) {
    let siblings = (['V1','V2','V3'] as const).map(variation => generateFullBeat({
      ...createDefaultConfig(100000 + i * 777), variation,
      scale: (['natural_minor','harmonic_minor','phrygian','dorian'] as const)[i % 4],
    }));
    for (let round = 0; round < 3; round++) {
      for (const target of targets) {
        siblings = siblings.map(beat => recookBeat(beat, target));
        const motif = (beat: BeatData, bar: number) => beat.tracks.melody.notes
          .filter(n => n.bar === bar).map(({ bar: _b, step: _s, ...note }) => note);
        for (const beat of siblings) {
          assert.deepEqual(motif(beat, 0), motif(siblings[0], 0), `${i}/${round}/${target}/${beat.config.variation}`);
          assert.deepEqual(motif(beat, 4), motif(beat, 0), 'exact home return includes velocity and duration');
          assert.equal(beat.config.rootKey, siblings[0].config.rootKey);
          assert.equal(beat.config.scale, siblings[0].config.scale);
        }
      }
    }
  }
});
