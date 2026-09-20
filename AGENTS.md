# SlapDesk development rules

- SlapDesk is a local-first application. Keep generation and audio workflows local unless a deliberate product decision changes that.
- Preserve the existing drum and 808 engines unless the task deliberately changes them and includes focused regression coverage.
- Aim for original Bay Area and modern West Coast slap with Detroit influence.
- Do not copy recognizable songs, melodies, or artist patterns.
- Deterministic code owns note timing and pitch generation.
- V1, V2, and V3 are sibling variations of one cookup, not unrelated beats.
- Preserve phrase memory and exact required bar relationships, including bar 1/bar 5 identity.
- Targeted Recook Music, Recook Drums, and Recook 808 must preserve unrelated lanes and user settings.
- Keep track configuration separate from generated musical-event data.
- Avoid generic arpeggios, constant 16th-note hats, four-on-the-floor defaults, and random scale-note melodies.
- Preserve useful silence and vocal space.
- Run regression tests before accepting generator changes. Confirm the MIDI baseline when a change should not affect exported MIDI.
- Do not rebuild working systems from scratch without a clear reason.
- Keep the roadmap in this general order: Studio Kit, saved sessions, cleaner UI, improved melody engine, MIDI handoff, FL Studio integration, and Pro Tools handoff.
