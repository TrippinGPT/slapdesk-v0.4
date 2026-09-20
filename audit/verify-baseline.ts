import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createDefaultConfig,generateFullBeat} from '../src/engine/generator';
import {generateMidiFile} from '../src/engine/midiWriter';
import {getRootMidi,getScaleMidiNotes,isPitchInScale,NOTE_NAMES} from '../src/engine/scales';
import {runAutomatedTestSuite} from '../src/engine/qaTester';
import {exportProjectZip} from '../src/engine/zipExporter';
import JSZip from 'jszip';
const scales = ['natural_minor','harmonic_minor','phrygian','dorian'] as const;
const hashes = JSON.parse(readFileSync(new URL('./before-midi-hashes.json',import.meta.url),'utf8'));
for (const rootKey of NOTE_NAMES) for (const scale of scales) for (const variation of ['V1','V2','V3'] as const) {
 const bytes = generateMidiFile(generateFullBeat({...createDefaultConfig(123456),rootKey,scale,variation}));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),hashes[`${rootKey}/${scale}/${variation}`]);
}
for (const [flat,sharp] of [['Db','C#'],['Eb','D#'],['Gb','F#'],['Ab','G#'],['Bb','A#']]) for (const scale of scales) {
 assert.equal(getRootMidi(flat,1),getRootMidi(sharp,1));
 assert.deepEqual(getScaleMidiNotes(flat,scale,[1,2]),getScaleMidiNotes(sharp,scale,[1,2]));
 const flatBeat=generateFullBeat({...createDefaultConfig(123456),rootKey:flat,scale});
 const sharpBeat=generateFullBeat({...createDefaultConfig(123456),rootKey:sharp,scale});
 assert.deepEqual(generateMidiFile(flatBeat),generateMidiFile(sharpBeat));
 for (const n of flatBeat.tracks.bass808.notes) assert.ok(isPitchInScale(n.pitch,flat,scale));
}
const qa=await runAutomatedTestSuite(); assert.ok(qa.passed);
writeFileSync(new URL('./qa-after.json',import.meta.url),JSON.stringify(qa,null,2));
const blob=await exportProjectZip(generateFullBeat(createDefaultConfig(123456)));
const zip=await JSZip.loadAsync(await blob.arrayBuffer());
const files=Object.values(zip.files).filter(f=>!f.dir);
assert.equal(files.filter(f=>f.name.endsWith('.mid')).length,7);
assert.equal(files.length,11);
// Parse every exported MIDI chunk and event rather than checking only its magic bytes.
for (const file of files.filter(f=>f.name.endsWith('.mid'))) {
 const b=await file.async('uint8array'); const v=new DataView(b.buffer,b.byteOffset,b.byteLength);
 const text=(p:number,n:number)=>String.fromCharCode(...b.slice(p,p+n));
 assert.equal(text(0,4),'MThd'); assert.equal(v.getUint32(4),6); assert.equal(v.getUint16(8),1); assert.equal(v.getUint16(12),480);
 let p=14; let noteOns=0;
 const vlq=()=>{let value=0,byte=0,count=0;do{assert.ok(p<b.length);byte=b[p++];value=(value<<7)|(byte&127);assert.ok(++count<=4);}while(byte&128);return value;};
 for(let t=0;t<v.getUint16(10);t++) {
  assert.equal(text(p,4),'MTrk'); const end=p+8+v.getUint32(p+4); p+=8; let eot=false;
  while(p<end){vlq();const status=b[p++]; if(status===255){const type=b[p++];const len=vlq();p+=len;if(type===47)eot=true;}else{assert.ok(status>=128&&status<240);const count=(status>>4)===12||(status>>4)===13?1:2;for(let j=0;j<count;j++)assert.ok(b[p++]<128);if((status>>4)===9)noteOns++;}assert.ok(p<=end);}
  assert.equal(p,end); assert.ok(eot);
 }
 assert.equal(p,b.length); assert.ok(noteOns>0);
}
console.log('PASS: 144 unchanged MIDI fingerprints; 20 flat/scale equivalence cases; existing 100/300 QA suite; ZIP with 7 parsed MIDI files and 4 supporting files.');
