import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { createDefaultConfig, generateFullBeat } from '../src/engine/generator';
import { generateMidiFile } from '../src/engine/midiWriter';
import { NOTE_NAMES } from '../src/engine/scales';
const hashes = {};
for (const rootKey of NOTE_NAMES) for (const scale of ['natural_minor','harmonic_minor','phrygian','dorian'] as const) for (const variation of ['V1','V2','V3'] as const) {
 const beat = generateFullBeat({...createDefaultConfig(123456),rootKey,scale,variation});
 hashes[`${rootKey}/${scale}/${variation}`] = createHash('sha256').update(generateMidiFile(beat)).digest('hex');
}
writeFileSync(process.argv[2], JSON.stringify(hashes,null,2));
