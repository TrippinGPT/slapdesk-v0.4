import { BeatConfig, BeatData, ReferenceDNA } from '../types';

export const SESSION_SCHEMA_VERSION = 1 as const;
export type VariationId = 'V1' | 'V2' | 'V3';

/** Durable production state only. Runtime audio and transient UI state are excluded. */
export interface SlapDeskSession {
  schemaVersion: typeof SESSION_SCHEMA_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  generatorSettings: BeatConfig;
  variations: Partial<Record<VariationId, BeatData>>;
  selectedVariation: VariationId;
  referenceDNA?: ReferenceDNA;
  masterVolume: number;
  studioKitReference: string | null;
  keepState: Record<string, boolean>;
}

export type SessionSaveStatus = 'saved' | 'saving' | 'unsaved';
