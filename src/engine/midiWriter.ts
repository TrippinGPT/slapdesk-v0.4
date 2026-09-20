/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BeatData, BeatTrack, NoteEvent } from '../types';

export const PPQ = 480;
export const TICKS_PER_SIXTEENTH = PPQ / 4; // 120 ticks

function writeVlq(value: number): number[] {
  const bytes: number[] = [];
  let buffer = value & 0x7f;
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  return bytes;
}

function writeString(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

function write32Bit(num: number): number[] {
  return [
    (num >> 24) & 0xff,
    (num >> 16) & 0xff,
    (num >> 8) & 0xff,
    num & 0xff,
  ];
}

function write16Bit(num: number): number[] {
  return [(num >> 8) & 0xff, num & 0xff];
}

interface RawMidiEvent {
  tick: number;
  data: number[];
}

function buildTrackChunk(trackName: string, channel: number, notes: NoteEvent[]): number[] {
  const rawEvents: RawMidiEvent[] = [];

  // Track Name Meta Event
  const nameBytes = writeString(trackName);
  rawEvents.push({
    tick: 0,
    data: [0xff, 0x03, nameBytes.length, ...nameBytes],
  });

  // Convert NoteEvents to note-on, note-off, and pitch-bends
  notes.forEach(note => {
    const startTick = note.step * TICKS_PER_SIXTEENTH + (note.microtiming || 0);
    const durationTicks = Math.max(1, note.duration) * TICKS_PER_SIXTEENTH;
    const endTick = startTick + durationTicks;
    const safeStartTick = Math.max(0, startTick);

    // Note On
    rawEvents.push({
      tick: safeStartTick,
      data: [0x90 | (channel & 0x0f), note.pitch & 0x7f, note.velocity & 0x7f],
    });

    // Pitch bend / glide for 808
    if (note.glideTo) {
      const glideTick = safeStartTick + Math.floor(durationTicks * 0.4);
      // Semitone difference to MIDI pitch wheel value (center = 8192)
      // Assuming +/- 12 semitones pitch bend range
      const semitoneDelta = note.glideTo - note.pitch;
      const bendValue = Math.min(16383, Math.max(0, Math.round(8192 + (semitoneDelta / 12) * 8191)));
      const lsb = bendValue & 0x7f;
      const msb = (bendValue >> 7) & 0x7f;

      rawEvents.push({
        tick: glideTick,
        data: [0xe0 | (channel & 0x0f), lsb, msb],
      });

      // Reset pitch bend right after note ends
      rawEvents.push({
        tick: endTick + 1,
        data: [0xe0 | (channel & 0x0f), 0x00, 0x40], // reset to 8192 center
      });
    }

    // Note Off
    rawEvents.push({
      tick: endTick,
      data: [0x80 | (channel & 0x0f), note.pitch & 0x7f, 0x00],
    });
  });

  // Sort events chronologically
  rawEvents.sort((a, b) => a.tick - b.tick);

  // Encode with delta times
  const trackBytes: number[] = [];
  let lastTick = 0;

  for (const ev of rawEvents) {
    const delta = Math.max(0, ev.tick - lastTick);
    lastTick = ev.tick;
    trackBytes.push(...writeVlq(delta));
    trackBytes.push(...ev.data);
  }

  // End of track meta event (FF 2F 00)
  trackBytes.push(...writeVlq(0));
  trackBytes.push(0xff, 0x2f, 0x00);

  // Build MTrk chunk
  return [
    ...writeString('MTrk'),
    ...write32Bit(trackBytes.length),
    ...trackBytes,
  ];
}

function buildTempoTrack(bpm: number): number[] {
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  const trackBytes: number[] = [];

  // Delta 0
  trackBytes.push(...writeVlq(0));
  // Time Signature: 4/4 (04 02 18 08)
  trackBytes.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // Delta 0
  trackBytes.push(...writeVlq(0));
  // Set Tempo: 3 bytes
  trackBytes.push(
    0xff,
    0x51,
    0x03,
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff
  );

  // End of Track
  trackBytes.push(...writeVlq(0));
  trackBytes.push(0xff, 0x2f, 0x00);

  return [
    ...writeString('MTrk'),
    ...write32Bit(trackBytes.length),
    ...trackBytes,
  ];
}

export function generateMidiFile(beatData: BeatData): Uint8Array {
  const bpm = beatData.config.bpm;
  const tracksList: BeatTrack[] = [
    beatData.tracks.melody,
    beatData.tracks.keys,
    beatData.tracks.bass808,
    beatData.tracks.kick,
    beatData.tracks.snare,
    beatData.tracks.hihat,
  ];

  const tempoTrackChunk = buildTempoTrack(bpm);
  const trackChunks: number[][] = [tempoTrackChunk];

  tracksList.forEach(track => {
    trackChunks.push(buildTrackChunk(track.name, track.channel, track.notes));
  });

  const numTracks = trackChunks.length; // 1 tempo track + 6 instrument tracks = 7 tracks
  const headerBytes: number[] = [
    ...writeString('MThd'),
    ...write32Bit(6), // Header chunk size is always 6
    ...write16Bit(1), // Format 1: Multi-track
    ...write16Bit(numTracks),
    ...write16Bit(PPQ),
  ];

  const fullFileBytes: number[] = [...headerBytes];
  for (const chunk of trackChunks) {
    fullFileBytes.push(...chunk);
  }

  return new Uint8Array(fullFileBytes);
}

export function generateSingleTrackMidi(track: BeatTrack, bpm: number): Uint8Array {
  const tempoTrack = buildTempoTrack(bpm);
  const trackChunk = buildTrackChunk(track.name, track.channel, track.notes);
  const numTracks = 2; // Tempo track + Track

  const headerBytes: number[] = [
    ...writeString('MThd'),
    ...write32Bit(6),
    ...write16Bit(1),
    ...write16Bit(numTracks),
    ...write16Bit(PPQ),
  ];

  return new Uint8Array([...headerBytes, ...tempoTrack, ...trackChunk]);
}
