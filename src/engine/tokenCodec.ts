/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BeatData, BeatTrack, NoteEvent } from '../types';

export function beatToTokens(beatData: BeatData): string {
  const { config, tracks } = beatData;
  const tokens: string[] = [];

  tokens.push('<|start_beat|>');
  tokens.push(`BPM:${config.bpm}`);
  tokens.push(`KEY:${config.rootKey}`);
  tokens.push(`SCALE:${config.scale}`);
  tokens.push(`PHRASE_FAM:${config.phraseFamilyId}`);
  tokens.push(`KICK_FAM:${config.kickFamilyId}`);
  tokens.push(`BASS_FAM:${config.bassFamilyId}`);
  tokens.push(`HAT_FAM:${config.hatFamilyId}`);
  tokens.push(`VOCAL_SPACE:${config.vocalSpace}`);
  tokens.push(`BASS_MOV:${config.bassMovement}`);

  // Melody
  tokens.push('TRACK:MELODY CH:0');
  tracks.melody.notes.forEach(n => {
    tokens.push(`N s:${n.step} p:${n.pitch} d:${n.duration} v:${n.velocity}`);
  });

  // Keys
  tokens.push('TRACK:KEYS CH:1');
  tracks.keys.notes.forEach(n => {
    tokens.push(`N s:${n.step} p:${n.pitch} d:${n.duration} v:${n.velocity}`);
  });

  // 808
  tokens.push('TRACK:808 CH:2');
  tracks.bass808.notes.forEach(n => {
    const glideStr = n.glideTo ? ` g:${n.glideTo}` : '';
    tokens.push(`N s:${n.step} p:${n.pitch} d:${n.duration} v:${n.velocity}${glideStr}`);
  });

  // Drums
  tokens.push('TRACK:DRUMS CH:9');
  const allDrums = [
    ...tracks.kick.notes,
    ...tracks.snare.notes,
    ...tracks.hihat.notes,
  ].sort((a, b) => a.step - b.step || a.pitch - b.pitch);

  allDrums.forEach(d => {
    const microStr = d.microtiming ? ` m:${d.microtiming}` : '';
    tokens.push(`D s:${d.step} p:${d.pitch} v:${d.velocity}${microStr}`);
  });

  tokens.push('<|end_beat|>');
  return tokens.join(' ');
}

export function getPythonDecoderScript(): string {
  return `#!/usr/bin/env python3
"""
SlapDesk v0.4 — Token-to-MIDI Decoder for Ollama / LLM outputs
Pure standard library Python 3 (zero external pip requirements)
Generates multi-track Type 1 MIDI (480 PPQ) for FL Studio cooking.
"""

import sys
import re

PPQ = 480
SIXTEENTH = PPQ // 4

def write_vlq(value):
    buf = value & 0x7F
    bytes_arr = bytearray()
    while (value := value >> 7) > 0:
        buf = (buf << 8) | (value & 0x7F) | 0x80
    while True:
        bytes_arr.append(buf & 0xFF)
        if buf & 0x80:
            buf >>= 8
        else:
            break
    return bytes_arr

def build_track(name, events):
    """events: list of (tick, data_bytes)"""
    events.sort(key=lambda x: x[0])
    raw = bytearray()
    
    # Meta: Track Name
    name_bytes = name.encode('utf-8')
    raw += write_vlq(0)
    raw += bytes([0xFF, 0x03, len(name_bytes)]) + name_bytes
    
    last_tick = 0
    for tick, data in events:
        delta = max(0, tick - last_tick)
        last_tick = tick
        raw += write_vlq(delta)
        raw += bytes(data)
        
    # End of Track
    raw += write_vlq(0)
    raw += bytes([0xFF, 0x2F, 0x00])
    
    chunk = bytearray(b'MTrk')
    chunk += len(raw).to_bytes(4, 'big')
    chunk += raw
    return chunk

def build_tempo_track(bpm):
    us_per_beat = int(round(60000000 / bpm))
    raw = bytearray()
    # Time Sig 4/4
    raw += write_vlq(0)
    raw += bytes([0xFF, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08])
    # Set Tempo
    raw += write_vlq(0)
    raw += bytes([0xFF, 0x51, 0x03, (us_per_beat >> 16) & 0xFF, (us_per_beat >> 8) & 0xFF, us_per_beat & 0xFF])
    # End
    raw += write_vlq(0)
    raw += bytes([0xFF, 0x2F, 0x00])
    
    chunk = bytearray(b'MTrk')
    chunk += len(raw).to_bytes(4, 'big')
    chunk += raw
    return chunk

def decode_tokens_to_midi(token_text, output_file="slapdesk_output.mid"):
    # Clean text to tokens
    tokens = token_text.strip().split()
    if "<|start_beat|>" in tokens:
        tokens = tokens[tokens.index("<|start_beat|>") + 1 :]
    if "<|end_beat|>" in tokens:
        tokens = tokens[: tokens.index("<|end_beat|>")]
        
    bpm = 100
    current_track = None
    current_channel = 0
    tracks_events = {
        "Melody": (0, []),
        "Keys": (1, []),
        "808 Bass": (2, []),
        "Drums": (9, []),
    }
    
    for tok in tokens:
        if tok.startswith("BPM:"):
            bpm = int(tok.split(":")[1])
        elif tok.startswith("TRACK:"):
            name = tok.split(":")[1]
            if "MELODY" in name:
                current_track, current_channel = "Melody", 0
            elif "KEYS" in name:
                current_track, current_channel = "Keys", 1
            elif "808" in name:
                current_track, current_channel = "808 Bass", 2
            elif "DRUMS" in name:
                current_track, current_channel = "Drums", 9
        elif tok == "N" or tok.startswith("N"):
            continue
        elif tok.startswith("s:"):
            pass # parsed in grouped regex
            
    # Grouped regex parser for notes
    # Example: N s:0 p:60 d:3 v:96 g:72
    pattern_note = re.finditer(r'(?:N|D)\s+s:(\\d+)\s+p:(\\d+)(?:\s+d:(\\d+))?\s+v:(\\d+)(?:\s+g:(\\d+))?(?:\s+m:(-?\\d+))?', token_text)
    
    # Track splitter
    sections = re.split(r'TRACK:(\\w+)\\s+CH:(\\d+)', token_text)
    header = sections[0]
    
    bpm_match = re.search(r'BPM:(\\d+)', header)
    if bpm_match:
        bpm = int(bpm_match.group(1))
        
    for i in range(1, len(sections), 3):
        t_name = sections[i]
        t_ch = int(sections[i+1])
        t_body = sections[i+2]
        
        ev_list = []
        for match in re.finditer(r'(?:N|D)\s+s:(\\d+)\s+p:(\\d+)(?:\s+d:(\\d+))?\s+v:(\\d+)(?:\s+g:(\\d+))?(?:\s+m:(-?\\d+))?', t_body):
            step = int(match.group(1))
            pitch = int(match.group(2))
            dur = int(match.group(3)) if match.group(3) else 1
            vel = int(match.group(4))
            glide = int(match.group(5)) if match.group(5) else None
            micro = int(match.group(6)) if match.group(6) else 0
            
            start_tick = max(0, step * SIXTEENTH + micro)
            end_tick = start_tick + dur * SIXTEENTH
            
            # Note on
            ev_list.append((start_tick, [0x90 | t_ch, pitch & 0x7F, vel & 0x7F]))
            
            # Pitch bend glide
            if glide is not None:
                glide_tick = start_tick + int(dur * SIXTEENTH * 0.4)
                semi_diff = glide - pitch
                bend_val = min(16383, max(0, int(8192 + (semi_diff / 12) * 8191)))
                ev_list.append((glide_tick, [0xE0 | t_ch, bend_val & 0x7F, (bend_val >> 7) & 0x7F]))
                ev_list.append((end_tick + 1, [0xE0 | t_ch, 0x00, 0x40]))
                
            # Note off
            ev_list.append((end_tick, [0x80 | t_ch, pitch & 0x7F, 0x00]))
            
        tracks_events[t_name] = (t_ch, ev_list)

    # Build MIDI file
    chunks = [build_tempo_track(bpm)]
    for t_name, (ch, evs) in tracks_events.items():
        if evs:
            chunks.append(build_track(t_name, evs))
            
    header_chunk = bytearray(b'MThd')
    header_chunk += (6).to_bytes(4, 'big')
    header_chunk += (1).to_bytes(2, 'big') # Type 1
    header_chunk += len(chunks).to_bytes(2, 'big')
    header_chunk += PPQ.to_bytes(2, 'big')
    
    with open(output_file, 'wb') as f:
        f.write(header_chunk)
        for c in chunks:
            f.write(c)
            
    print(f"[SlapDesk v0.4] Successfully decoded {output_file} ({len(chunks)} tracks, {bpm} BPM)")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            decode_tokens_to_midi(f.read())
    else:
        print("Usage: python slapdesk_token_decoder.py [beat_tokens.txt]")
`;
}

export function getLlamaFactoryYaml(): string {
  return `# LLaMA-Factory Fine-Tuning Setup for SlapDesk v0.4
# Optimized for Llama-3-8B-Instruct or Qwen-2.5-7B
# Hardware: Local NVIDIA GPU (RTX 3090/4090) or Intel NUC eGPU

model_name_or_path: meta-llama/Meta-Llama-3-8B-Instruct
stage: sft
do_train: true
finetuning_type: lora
lora_target: all
lora_rank: 16
lora_alpha: 32
lora_dropout: 0.05

dataset: slapdesk_beats_2000
dataset_dir: data
template: llama3
cutoff_len: 2048
max_samples: 2000
overwrite_cache: true
preprocessing_num_workers: 8

output_dir: saves/slapdesk_v0.4_lora
logging_steps: 10
save_steps: 100
plot_loss: true
overwrite_output_dir: true

per_device_train_batch_size: 2
gradient_accumulation_steps: 8
learning_rate: 0.0002
num_train_epochs: 4.0
lr_scheduler_type: cosine
warmup_ratio: 0.05
fp16: true
flash_attn: fa2

export_dir: export/slapdesk_gguf
export_quantization_bit: 4
export_device_map: auto
`;
}
