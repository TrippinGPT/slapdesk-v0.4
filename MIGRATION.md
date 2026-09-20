# SlapDesk v0.4 migration notes

## Version and architecture

This project is SlapDesk v0.4, a local-first React 19, TypeScript, Vite 6, and Tailwind 4 browser application. There is no active server or database. `src/App.tsx` owns the active cookup and UI state. `src/engine/generator.ts` coordinates the deterministic lane engines; `src/engine/recook.ts` replaces targeted event lanes while retaining settings and unrelated tracks. Track configuration and events have explicit types in `src/types.ts`.

The six lane engines are under `src/engine/`. `src/engine/audioEngine.ts` owns the singleton Web Audio context, synth/sample playback, transport, track mix gating, swing scheduling, per-track panning, and retained in-memory sample buffers. `src/engine/midiWriter.ts` writes MIDI; `src/engine/zipExporter.ts` packages MIDI stems and supporting artifacts. `src/components/` contains the DAW views and dialogs. See [ARCHITECTURE.md](ARCHITECTURE.md) for the detailed subsystem map and known boundaries.

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

Run all recook and playback tests with `npm test`. Run the focused suites separately with `node --import tsx --test tests/recook.test.ts` and `npm run test:playback`. Run TypeScript checking with `npm run lint`, and run the generator regression suite with `npm run test:generator`. The generator audit checks the 144 MIDI fingerprints, scale aliases, QA suite, and exported MIDI/ZIP structure.

## Known remaining issues

- MIDI export does not yet apply `BeatConfig.swing`; playback swing is derived at scheduling time. Track pan and mixer mute/solo/volume are playback settings and are not represented in MIDI.
- Studio Kit sample assignments are held in memory only. There is no saved-session or sample restoration flow.
- The bundled `public/slapdesk_v0.4_source_code.zip` is a supplied, stale source bundle. It is retained as a public app asset and is not the authoritative current source tree.
- Production builds pass with an existing warning that the minified JavaScript chunk exceeds 500 kB.
- The legacy README and `.env.example` contain AI Studio setup boilerplate; those values are placeholders, not required credentials. The current application does not require an API key for local generation or playback.

## Roadmap

Continue in this general order: Studio Kit, saved sessions, cleaner UI, improved melody engine, MIDI handoff, FL Studio integration, and Pro Tools handoff.

## Development handoff

- Last completed task: **SlapDesk v0.4 — Playback Fidelity Pass**. Playback now schedules swing without mutating generated events, routes tracks through persistent stereo panners, honors track mix state, cleans up ended voice nodes, and has focused regression tests. The generated MIDI event data and 144 baseline outputs remain unchanged.
- Next recommended task: **Studio Kit sample assignment and user-kit management**. Extend the existing local sample-loading path, preserve the generated engines, and keep the implementation ready for saved-session persistence. Do not combine this with a broad UI or generator rewrite.
