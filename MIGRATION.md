# SlapDesk v0.4 migration notes

## Version and architecture

This project is SlapDesk v0.4, a local-first React 19, TypeScript, Vite 6, and Tailwind 4 browser application. It has no application server or cloud database. Studio Kit binaries and metadata and saved Cookup sessions are stored in browser-local IndexedDB. `src/App.tsx` owns the active cookup and connects it to session storage. `src/engine/generator.ts` coordinates the deterministic lane engines; `src/engine/recook.ts` replaces targeted event lanes while retaining settings and unrelated tracks. Track configuration and events have explicit types in `src/types.ts`.

The six lane engines are under `src/engine/`. `src/engine/audioEngine.ts` owns the singleton Web Audio context, synth/sample playback, transport, track mix gating, shared swing timing, per-track panning, and the decoded sample cache. `src/engine/studioKitService.ts` owns local kit operations and sample assignment references; `src/engine/studioKitStore.ts` stores serializable kit metadata and original audio blobs in separate IndexedDB stores. `src/engine/sessionTypes.ts`, `sessionMigration.ts`, `sessionService.ts`, and `sessionStore.ts` define and persist validated versioned sessions. Session records share the Studio Kit database but use separate object stores; they store beat events and a kit ID, never audio binaries or runtime audio objects. AudioBuffers remain runtime-only. `src/engine/midiWriter.ts` writes arrangement-filtered MIDI; `src/engine/zipExporter.ts` packages full, music, drum-group, and individual-track MIDI files plus supporting text/metadata artifacts. User audio is not included in ZIP exports. `src/components/` contains the DAW views and dialogs, including the lightweight Session Library. See [ARCHITECTURE.md](ARCHITECTURE.md) for the detailed subsystem map and known boundaries.

Playback and MIDI share the swing subdivision rule and seconds calculation: `delay = (60 / BPM / 4) * 0.5 * (clamp(swing, 0, 100) / 100)`. It applies on `stepInBar % 4 === 2` to kick, hats, 808, melody, and keys; snare/clap events remain fixed. MIDI rounds each event's delay to the nearest 480-PPQ tick, independently per bar. Mute and disabled state take precedence; if a track is muted or disabled it stays silent even when soloed. Otherwise, when any track is soloed, only soloed tracks play. Multiple soloed tracks play together.

## Install and run

From the repository root, install the checked-in Bun lockfile and start the development server:

```bash
bun install --frozen-lockfile
npm run dev
```

Alternatively, with Node.js and npm only:

```bash
npm install
npm run dev
```

The dev server listens on port 3000. Build production files with `npm run build`; Vite writes them to the ignored `dist/` folder.

## Checks

Run all recook, playback, MIDI export, Studio Kit, and session persistence tests with `npm test`. Run focused suites with `node --import tsx --test tests/recook.test.ts`, `npm run test:playback`, `npm run test:midi`, `npm run test:studio-kit`, and `npm run test:sessions`. Run TypeScript checking with `npm run lint`, build with `npm run build`, and run the generator regression suite with `npm run test:generator`. The generator audit checks all 144 straight-timing MIDI fingerprints, scale aliases, QA suite, and exported MIDI/ZIP structure.

## Known remaining issues

- Pan, volume, and solo remain playback-only and are not represented in MIDI. MIDI has no project key metadata yet.
- Sessions are local to the browser profile and do not sync across devices. The UI exposes the active V1/V2/V3 snapshots through the current variation workflow; sessions preserve cooked snapshots, with the currently selected variation restored without generation.
- Imported 808 samples use note-duration stop/envelope and playback-rate glide automation. Samples are not looped, so a short source can end before a longer generated note duration.
- AIFF/AIF import depends on the current browser's `decodeAudioData` support; WAV is the first-class format.
- The bundled `public/slapdesk_v0.4_source_code.zip` is a supplied, stale source bundle. It is retained as a public app asset and is not the authoritative current source tree.
- Production builds pass with an existing warning that the minified JavaScript chunk exceeds 500 kB.
- The legacy README and `.env.example` contain AI Studio setup boilerplate; those values are placeholders, not required credentials. The current application does not require an API key for local generation or playback.

## Roadmap

Continue in this general order: cleaner UI, improved melody engine, MIDI handoff, FL Studio integration, and Pro Tools handoff. Studio Kit and saved sessions are complete as separate local subsystems.

## Development handoff

- Last completed task: **SLAPDESK v0.4 — FULL SESSION PERSISTENCE PASS**. Versioned local sessions, debounced autosave, explicit save, New/Save As/Rename/Open/Delete, last-session restore, V1/V2/V3 snapshots, recook history, arrangement and track settings, references, and Studio Kit references are stored in shared IndexedDB. Session loading restores events without generator calls; sample binaries remain in Studio Kit storage.
- Next recommended task: **Cleaner UI pass**. Make the existing DAW screens easier to use without changing generation, playback, session, or MIDI behavior; keep the current Session Library and Studio Kit domains intact.
