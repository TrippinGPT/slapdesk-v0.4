# SlapDesk v0.4 baseline inspection

Inspected the extracted application, every source module/component, configuration, pattern libraries, and the bundled source archive inventory/comparison. The uploaded ZIP remains untouched. No redesign, feature implementation, dependency upgrades, or large refactor was performed. README instructions and source comments were treated as project context, not authorization to deploy or configure services.

## Baseline result

- Installed the existing `bun.lock` with `npx --yes --cache .npm-cache bun install --frozen-lockfile`. Package manifest and lockfile are unchanged.
- `npm run build`: PASS before and after fixes. Existing ~558 kB JavaScript chunk warning remains; no bundling refactor undertaken.
- `npm run lint`: PASS. This command is TypeScript checking only (`tsc --noEmit`), not ESLint or React Hooks linting.
- No `test` script or conventional test-runner configuration exists. Executed the existing `runAutomatedTestSuite(100)` directly and through Test Lab: initially 20 in-key-bass failures; now PASS, 100 cookups / 300 variations.
- `node --import tsx audit/verify-baseline.ts`: PASS. Checks 144 original MIDI fingerprints, 20 flat-key/scale equivalence combinations, existing QA, ZIP contents, and the chunks/events of all seven exported MIDI files.
- Browser smoke checks: all five main views, V1/V2/V3 controls, reference/source/QA/sample/token dialogs; production preview renders, transport advances, pause and reset work. No new console errors after reload/fixes in these checks. This verifies execution, not subjective listening quality. Custom audio decoding/upload and external-DAW playback were not end-to-end tested.
- Development server: http://127.0.0.1:3000. Built preview: http://127.0.0.1:4173. Vite/esbuild required execution outside the filesystem sandbox because parent-directory traversal was denied; that was an environment restriction, not an application defect.

Only six original source files changed (listed in `audit/changed-original-files.json`):

1. `src/engine/scales.ts`: common flat spellings now resolve to their sharp equivalents in all three root/scale helpers. Eb/Bb were selectable but previously generated pitches using the C fallback. All 144 checked canonical-key MIDI outputs remain byte-for-byte unchanged.
2. `StudioKitModal.tsx`, `ReferenceModeModal.tsx`, `TestLabModal.tsx`, `TokenLabModal.tsx`, `CodeViewerModal.tsx`: hooks now execute before the closed-modal return. Opening Code Viewer reproduced React's “Expected static flag was missing” error. Its effect now skips loading while closed and runs when opened. The same conditional-hook defect was removed from the other four modals. No layout changed.

## Architecture map

All source paths below are relative to this project. It is a client-only React 19 / TypeScript / Vite 6 / Tailwind 4 application. There is no active Express backend, AI generation service, router, global store, or database. README/API-key boilerplate is unused by the running app.

| Subsystem | Controlling files/functions | Current behavior |
|---|---|---|
| Entry and contracts | `src/main.tsx`, `src/types.ts` | StrictMode mount; `BeatConfig`, `BeatData`, `BeatTrack`, `NoteEvent`, `ReferenceDNA`, `SampleKit`. Fixed six tracks, eight bars, 128 sixteenth steps. |
| App/state coordinator | `src/App.tsx`: `handleUpdateTrack`, `handleNewCookup`, `handleRecook`, reference/export/transport handlers | Owns config, generated/edited beat, reference, transport display and workspace state. Props down, callbacks up. |
| UI/navigation | `DawHeader.tsx`, `DawSidebar.tsx`; `SongEditor.tsx`, `BeatBasslineEditor.tsx`, `PianoRoll.tsx`, `FxMixer.tsx`, `DawGeneratorView.tsx` in `src/components` | Transport/tools; libraries; bar enable/disable; step toggles/fills; pitch/duration editing and transpose; channel settings; generation controls. Five production modals provide kit/reference/QA/token/source tools. |
| Generation coordinator | `src/engine/generator.ts`: `createDefaultConfig`, `generateFullBeat` | Applies reference overrides; generates 808 first, melody candidates next, interlocking keys, then drums. Builds tracks and phrase labels; isolated recooks reuse other tracks' note arrays. |
| Drums | `drumsEngine.ts`: `generateKickTrack`, `generateSnareClapTrack`, `generateHiHatTrack`; `kickFamilies.ts`, `hatFamilies.ts` | 44 kick and 22 hat families. Fixed clap backbeat plus turnaround snare rolls; vocal-space filtering and tick-based swing metadata. Drum generation is family/config based, not seeded random generation. |
| 808 | `bassEngine.ts`: `generate808Track`; `808Families.ts` | Ten patterns with scale snapping, movement filtering, octave/glide targets and bar-eight space. Uses key/mode/family rather than seed. |
| Melody | `melodyEngine.ts`: `generateMelodyTrackWithGrammar`, private `buildCandidateMelody`; `motifCells.ts`, `melodyPersonalities.ts`, `melodyQuality.ts`: `evaluateMelodyQuality` | Seeded PRNG selects from 32 motif cells and eight personalities. Builds call/response, bar-five return, turnaround space; evaluates up to six candidates. |
| Keys and theory | `secondaryEngine.ts`: `generateKeysTrack`; `scales.ts` | Seeded chord velocities; stabs avoid some melody onset collisions. Four scale definitions, MIDI pitch/frequency/name helpers. |
| V1/V2/V3 | `DawGeneratorView.updateConfig` → App → `generateFullBeat`; branches in melody/drums/bass engines | V1 base. V2 alters selected response pitches, turnaround velocities/rolls and one 808 octave. V3 removes melody bar six and kick bar eight. Keys ignore the variation argument directly. Family IDs are not switched by the variation buttons. |
| Playback | `audioEngine.ts`: singleton `audioEngine`; `init`, `play`, `pause`, `stop`, `setBeatData`, `scheduleLoop`, `scheduleStep`, instrument methods | Web Audio synths/sample sources → shared compressor → master gain. 25 ms scheduler, 150 ms lookahead; loops 128 steps. Track mute/solo, volume and disabled bars are read at scheduling time. |
| MIDI/ZIP/tokens | `midiWriter.ts`: `generateMidiFile`, `generateSingleTrackMidi`, `buildTrackChunk`; `zipExporter.ts`: `exportProjectZip`; `tokenCodec.ts` | Type-1 MIDI, 480 PPQ, tempo + six tracks. ZIP contains full MIDI, six MIDI stems, tokens, Python decoder, training YAML and metadata. No audio stem rendering. Token/LLM tooling exports recipes/text; it does not call Ollama. |
| Presets/references | `referenceLibrary.ts`: `CURATED_REFERENCE_TARGETS`; App reference handlers; `ReferenceModeModal`; `audioEngine.analyzeReferenceAudio` | Five hand-authored reference targets. Uploaded audio uses local energy/transient heuristics, not true source separation or robust tempo correlation. Sidebar sample/preset names audition shared synth methods rather than distinct stored instruments. |
| Sample loading | `StudioKitModal.handleFileUpload`, `handleAudition`, `handleClearSlot`, `handleResetAll`; `audioEngine.decodeAndNormalizeSample`, `setCustomSample`, `playBuffer` | Five in-memory slots: kick, snare/clap, closed/open hat, 808. Browser decode, peak scaling, synthetic fallback. Sampled 808 assumes C1 tuning and changes playback rate. No melody/keys sample slots. |
| Persistence | App React state + AudioEngine private fields | None across reloads: no localStorage, IndexedDB, project import, sample store, undo history or save/load service. Exported ZIP is not a restorable session and omits edited track/mixer state and sample audio. |

## Shared state and fragile boundaries

`UI → App config → generateFullBeat → BeatData → editors/audio/export` is the primary flow. Editors replace tracks through `handleUpdateTrack`; App's effect passes the new beat to the audio singleton. Audio callbacks update the React playhead. Sample buffers live only inside that singleton; sample labels live separately in the modal. Preview buttons bypass App and call the singleton directly.

Priority findings left unchanged because they affect existing product/musical behavior:

- **Regeneration loses edits/settings.** Config/variation changes regenerate all notes. Isolated recooks preserve other note arrays and mute/solo, but discard volume, pan, disabled bars and color even on untouched tracks. Reproduced loss of melody settings during drum recook. With unchanged inputs, recooking an unedited stem gives identical notes. Melody quality/name metadata is regenerated even when existing melody notes are retained.
- **Split config/reference ownership.** App stores requested `config` separately from `beatData.config`, which includes reference overrides. Controls/export filenames can disagree with actual generated settings. Reference fields are mapped twice in App and again in the generator. Unchecking the reference lock only postpones enforcement: later generation still receives DNA. Clearing DNA does not clear `beatData.referenceDNA` immediately.
- **Playback/export mismatch.** Playback ignores `microtiming` and pan; MIDI applies tick offsets but ignores mute/solo/disabled bars/volume/pan. MIDI bend math assumes ±12 semitones without emitting the pitch-bend-range RPN. Bend events are channel-wide, so overlaps can interfere. Loop-end track lengths are not padded to eight bars.
- **Transport lifecycle.** Seeking while playing calls `play` without cancelling the previous timer chain. Stop/pause clear the scheduler but do not stop active sources or cancel all queued UI callbacks. Changing master volume before audio initialization is lost when init sets 0.85.
- **Display-only controls/claims.** Loop toggle, soft clipper and stereo widener are local UI state only; the engine always loops. VU meters use random indicators, not measured audio. The reported sample rate, bit depth and peak safety are not established by those displays. The melody status card always displays PASSED.
- **Melody/keys limits.** `active808Pitches` is passed but never used; keys collision handling examines onsets only. Harmonic-minor bar-seven melody tension and dark-keys extensions can use the out-of-scale flat seventh (reproduced). Lower-register motif notes snap into a scale-note pool beginning at the chosen root, collapsing intended low notes. Quality retries are evaluated per variation and could select different candidates outside the tested matrix.
- **Samples/analysis.** Sampled 808 ignores note duration and glide; no choke/voice management or source-tuning metadata. Normalization target 0.94 is about -0.54 dB, but peaks ≥0.98 bypass scaling. Very short reference clips can divide by zero when there are no complete analysis chunks. Upload size/drag-and-drop claims are not implemented as validation/handlers.
- **QA overclaims.** `studioKitNormalizationOk` is initialized true and never tested. MIDI validation in the original suite checks only header bytes; recook isolation checks only drum recook note preservation; bass checks exclude glide targets. Musical quality and sibling assertions cover a limited fixed matrix, not every configuration. The additional audit checks strengthen exports and the flat-key fix without claiming complete coverage.

## Duplicated and inactive code

- `CookupControls.tsx` and `PatternGrid.tsx` are legacy components with no imports from the active app. Some controls (personality, phrase/808 family, recook intents, seed input) exist there but are absent from the current generator screen.
- `generateMelodyTrack` compatibility wrapper, `PHRASE_ROLES`, `SampleKitNames` and `KeysOptions` have no active consumers. Several imports and local state fields are unused. Snare's phrase-family argument and hats' density argument are unused. Phrase energy/dropout/glide fields and much personality/articulation metadata are descriptive rather than enforced.
- Track names/colors/default pitches and download helpers are repeated across views; TypeScript MIDI writing is separately reimplemented in an exported Python string. The decoder merges drum tracks and omits some note/session detail; it is not a lossless project round-trip.
- `@google/genai`, Express, dotenv and motion have no active source imports; Vite is listed in both dependency groups. No cleanup was performed.
- `public/slapdesk_v0.4_source_code.zip` was already stale: App, types, audio engine, HTML and metadata differ from the outer upload; it also lacks the current DAW component files. Kept intact as supplied. Code Viewer fetches transformed modules in dev and nonexistent source routes in production, not a reliable raw-source browser.

## Smallest safe next step — proposed, not started

Keep the current UI, `NoteEvent` contract, libraries and generator algorithms. First name one feature and its acceptance cases. Add it at its existing boundary rather than rebuilding the app: generation in the owning engine; sample capabilities through Studio Kit/AudioEngine; persistence through an explicit versioned session serializer.

Before any feature involving regeneration, make one bounded change to preserve complete untouched `BeatTrack` objects during isolated recooks, with a focused regression case. Then implement only that feature and check fixed-seed MIDI, manual edits, references, playback and export. For a sample feature, reuse the five-slot loader and add only required sample metadata/engine behavior; do not invent another audio engine. Broader store, scheduler or component refactors should have a separate reviewable plan first.

Reproduce verification from this directory with `npm run lint`, `npm run build`, and `node --import tsx audit/verify-baseline.ts`. Before/after QA output and MIDI fingerprints are retained in `audit/`.
