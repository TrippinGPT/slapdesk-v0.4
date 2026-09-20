/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { BeatData } from '../types';
import { generateDrumMidi, generateMidiFile, generateMusicMidi, generateSingleTrackMidi } from './midiWriter';
import { beatToTokens, getPythonDecoderScript, getLlamaFactoryYaml } from './tokenCodec';

export async function exportProjectZip(beatData: BeatData): Promise<Blob> {
  const zip = new JSZip();
  const { config } = beatData;
  const bpm = config.bpm;
  const prefix = `SlapDesk_Seed${config.seed}_${config.rootKey}_${bpm}BPM_${config.variation}`;

  // 1. Full Multi-Track Type 1 MIDI
  const fullMidiBytes = generateMidiFile(beatData);
  zip.file(`${prefix}_Full_MultiTrack.mid`, fullMidiBytes);
  zip.file(`${prefix}_Music.mid`, generateMusicMidi(beatData));
  zip.file(`${prefix}_Drums.mid`, generateDrumMidi(beatData));

  // 2. Individual Stems folder
  const stemsFolder = zip.folder('stems');
  if (stemsFolder) {
    stemsFolder.file(
      `01_Melody_PainLoop.mid`,
      generateSingleTrackMidi(beatData.tracks.melody, bpm, config.swing)
    );
    stemsFolder.file(
      `02_Dark_Keys.mid`,
      generateSingleTrackMidi(beatData.tracks.keys, bpm, config.swing)
    );
    stemsFolder.file(
      `03_808_Sub_Glides.mid`,
      generateSingleTrackMidi(beatData.tracks.bass808, bpm, config.swing)
    );
    stemsFolder.file(
      `04_Kick_Knock.mid`,
      generateSingleTrackMidi(beatData.tracks.kick, bpm, config.swing)
    );
    stemsFolder.file(
      `05_Clap_Snare.mid`,
      generateSingleTrackMidi(beatData.tracks.snare, bpm, config.swing)
    );
    stemsFolder.file(
      `06_HiHats_Perc.mid`,
      generateSingleTrackMidi(beatData.tracks.hihat, bpm, config.swing)
    );
  }

  // 3. LLM Tokens
  const tokens = beatToTokens(beatData);
  zip.file(`beat_tokens.txt`, tokens);

  // 4. Standalone Python Decoder Script (Option 1)
  zip.file(`slapdesk_token_decoder.py`, getPythonDecoderScript());

  // 5. LLaMA-Factory Training Config (Option 2)
  zip.file(`train_lora.yaml`, getLlamaFactoryYaml());

  // 6. JSON Metadata
  const metadata = {
    app: 'SlapDesk v0.4',
    timestamp: new Date().toISOString(),
    config: beatData.config,
    barStructure: beatData.barStructure,
    tracksSummary: {
      melodyNotes: beatData.tracks.melody.notes.length,
      keysNotes: beatData.tracks.keys.notes.length,
      bassNotes: beatData.tracks.bass808.notes.length,
      kickHits: beatData.tracks.kick.notes.length,
      snareHits: beatData.tracks.snare.notes.length,
      hatHits: beatData.tracks.hihat.notes.length,
    },
    referenceDNA: beatData.referenceDNA || null,
  };
  zip.file(`beat_metadata.json`, JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}
