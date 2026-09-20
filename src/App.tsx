/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BeatConfig, BeatData, ReferenceDNA, TrackType, BeatTrack, DawView } from './types';
import { createDefaultConfig, generateFullBeat } from './engine/generator';
import { recookBeat } from './engine/recook';
import { audioEngine } from './engine/audioEngine';
import { generateMidiFile } from './engine/midiWriter';
import { exportProjectZip } from './engine/zipExporter';
import { beatToTokens } from './engine/tokenCodec';
import { CURATED_REFERENCE_TARGETS, ReferenceTarget } from './engine/referenceLibrary';
import { studioKitService } from './engine/studioKitService';
import { sessionService } from './engine/sessionService';
import { SlapDeskSession, SessionSaveStatus, VariationId } from './engine/sessionTypes';

// LMMS DAW Modular Components
import { DawHeader } from './components/DawHeader';
import { DawSidebar } from './components/DawSidebar';
import { SongEditor } from './components/SongEditor';
import { BeatBasslineEditor } from './components/BeatBasslineEditor';
import { PianoRoll } from './components/PianoRoll';
import { FxMixer } from './components/FxMixer';
import { DawGeneratorView } from './components/DawGeneratorView';

// Production Modals
import { StudioKitModal } from './components/StudioKitModal';
import { ReferenceModeModal } from './components/ReferenceModeModal';
import { TestLabModal } from './components/TestLabModal';
import { TokenLabModal } from './components/TokenLabModal';
import { CodeViewerModal } from './components/CodeViewerModal';
import { SessionLibraryModal } from './components/SessionLibraryModal';

import { Check } from 'lucide-react';

export default function App() {
  // Beat Engine State
  const [config, setConfig] = useState<BeatConfig>(() => createDefaultConfig());
  const [beatData, setBeatData] = useState<BeatData>(() => createEmptyBeatData(config));
  const [isSessionBooting, setIsSessionBooting] = useState(true);
  const [referenceDNA, setReferenceDNA] = useState<ReferenceDNA | undefined>();
  const [currentSession, setCurrentSession] = useState<SlapDeskSession | null>(null);
  const [sessionSaveStatus, setSessionSaveStatus] = useState<SessionSaveStatus>('saved');
  const [sessionLibrary, setSessionLibrary] = useState<SlapDeskSession[]>([]);
  const [invalidSessionCount, setInvalidSessionCount] = useState(0);
  const [showSessionLibrary, setShowSessionLibrary] = useState(false);
  const [sessionKitReference, setSessionKitReference] = useState<string | null>(null);
  const [studioKitRevision, setStudioKitRevision] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const sessionHydratedRef = useRef(false);
  const skipAutosaveRef = useRef(false);
  const currentSessionRef = useRef<SlapDeskSession | null>(null);
  const sessionKitReferenceRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const latestSnapshotRef = useRef({ config, beatData, masterVolume, referenceDNA: undefined as ReferenceDNA | undefined });
  const variationSnapshotsRef = useRef<Partial<Record<VariationId, BeatData>>>({ [config.variation]: beatData });
  currentSessionRef.current = currentSession;
  sessionKitReferenceRef.current = sessionKitReference;
  latestSnapshotRef.current = { config, beatData, masterVolume, referenceDNA };

  const generateVariationSet = (nextConfig: BeatConfig, dna?: ReferenceDNA) => ({
    V1: generateFullBeat({ ...nextConfig, variation: 'V1' }, dna),
    V2: generateFullBeat({ ...nextConfig, variation: 'V2' }, dna),
    V3: generateFullBeat({ ...nextConfig, variation: 'V3' }, dna),
  });

  // LMMS DAW Workspace State
  const [activeView, setActiveView] = useState<DawView>('song_editor');
  const [focusedTrack, setFocusedTrack] = useState<TrackType>('melody');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);

  // Modals
  const [showStudioKit, setShowStudioKit] = useState(false);
  const [showReferenceMode, setShowReferenceMode] = useState(false);
  const [showTestLab, setShowTestLab] = useState(false);
  const [showTokenLab, setShowTokenLab] = useState(false);
  const [showCodeViewer, setShowCodeViewer] = useState(false);

  // Toast Notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setToastMsg(msg);
    toastTimeoutRef.current = window.setTimeout(() => setToastMsg(null), 3500);
  };

  // Connect Web Audio Callbacks
  useEffect(() => {
    void (async () => {
      try {
        await studioKitService.initialize();
        const saved = await sessionService.getLastOpened();
        if (saved) {
          const restored = saved.variations[saved.selectedVariation]!;
          variationSnapshotsRef.current = saved.variations;
          skipAutosaveRef.current = true;
          let missingKit = false;
          let sampleWarning = false;
          if (saved.studioKitReference) {
            try { sampleWarning = (await studioKitService.selectKit(saved.studioKitReference)).length > 0; }
            catch { missingKit = true; await studioKitService.selectKit(null); }
          } else {
            await studioKitService.selectKit(null);
          }
          setConfig(saved.generatorSettings);
          setBeatData(restored);
          setReferenceDNA(saved.referenceDNA ?? restored.referenceDNA);
          setMasterVolume(saved.masterVolume);
          audioEngine.setMasterVolume(saved.masterVolume);
          setCurrentSession(saved);
          setSessionKitReference(saved.studioKitReference);
          if (missingKit) showToast('Session opened; its Studio Kit is missing, so built-in sounds are active.');
          else if (sampleWarning) showToast('Some saved samples are unavailable; built-in sounds are active for those lanes.');
        } else {
          const initialConfig = latestSnapshotRef.current.config;
          const initialBeat = generateFullBeat(initialConfig);
          variationSnapshotsRef.current = generateVariationSet(initialConfig);
          variationSnapshotsRef.current.V1 = initialBeat;
          setBeatData(initialBeat);
          const created = await sessionService.saveCurrent(null, {
            config: initialConfig, beatData: initialBeat, masterVolume: 0.85,
            studioKitReference: studioKitService.getActiveKitId(),
            variations: variationSnapshotsRef.current,
          });
          skipAutosaveRef.current = true;
          setCurrentSession(created);
          setSessionKitReference(created.studioKitReference);
        }
        sessionHydratedRef.current = true;
        setIsSessionBooting(false);
      } catch (error) {
        const initialConfig = latestSnapshotRef.current.config;
        const initialBeat = generateFullBeat(initialConfig);
        variationSnapshotsRef.current = generateVariationSet(initialConfig);
        variationSnapshotsRef.current.V1 = initialBeat;
        setBeatData(initialBeat);
        sessionHydratedRef.current = true;
        setIsSessionBooting(false);
        showToast(error instanceof Error ? `Sessions unavailable: ${error.message}` : 'Sessions unavailable; this cookup is temporary.');
      }
    })();
    audioEngine.setCallbacks(
      (step, bar) => {
        setCurrentStep(step);
        setCurrentBar(bar);
      },
      playing => {
        setIsPlaying(playing);
      }
    );

    return () => {
      audioEngine.stop();
    };
  }, []);

  useEffect(() => {
    variationSnapshotsRef.current = { ...variationSnapshotsRef.current, [config.variation]: beatData };
  }, [config.variation, beatData]);

  // Persist production changes after a short quiet period. Transport position and audition state are excluded.
  useEffect(() => {
    if (!sessionHydratedRef.current || !currentSession?.id) return;
    if (skipAutosaveRef.current) { skipAutosaveRef.current = false; return; }
    setSessionSaveStatus('unsaved');
    const timer = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      const active = currentSessionRef.current;
      const snapshot = latestSnapshotRef.current;
      setSessionSaveStatus('saving');
      void sessionService.saveCurrent(active, {
        config: snapshot.config, beatData: snapshot.beatData, masterVolume: snapshot.masterVolume,
        referenceDNA: snapshot.referenceDNA, studioKitReference: sessionKitReferenceRef.current,
        variations: variationSnapshotsRef.current,
      }).then(saved => {
        setCurrentSession(saved);
        setSessionSaveStatus('saved');
      }).catch(error => {
        setSessionSaveStatus('unsaved');
        showToast(error instanceof Error ? `Session autosave failed: ${error.message}` : 'Session autosave failed.');
      });
    }, 900);
    autosaveTimerRef.current = timer;
    return () => { window.clearTimeout(timer); if (autosaveTimerRef.current === timer) autosaveTimerRef.current = null; };
  }, [config, beatData, masterVolume, referenceDNA, studioKitRevision, currentSession?.id]);

  // Synchronize Audio Engine Beat Data
  useEffect(() => {
    audioEngine.setBeatData(beatData);
  }, [beatData]);

  // Keyboard Shortcuts (Space: Play/Pause, F5: Song-Editor, F6: Step Sequencer, F7: Piano Roll, F9: Mixer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      } else if (e.code === 'F5') {
        e.preventDefault();
        setActiveView('song_editor');
      } else if (e.code === 'F6') {
        e.preventDefault();
        setActiveView('beat_bassline');
      } else if (e.code === 'F7') {
        e.preventDefault();
        setActiveView('piano_roll');
      } else if (e.code === 'F9') {
        e.preventDefault();
        setActiveView('mixer');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, beatData]);

  const handlePlayToggle = () => {
    if (isSessionBooting) return;
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play(beatData, currentStep);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setCurrentStep(0);
    setCurrentBar(0);
  };

  const handleJumpToStep = (step: number) => {
    const targetStep = Math.max(0, Math.min(127, step));
    setCurrentStep(targetStep);
    setCurrentBar(Math.floor(targetStep / 16));
    if (isPlaying) {
      audioEngine.play(beatData, targetStep);
    }
  };

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    audioEngine.setMasterVolume(vol);
  };

  // Track State Updates (Notes, Volume, Pan, Mute, Solo, DisabledBars)
  const handleUpdateTrack = (trackType: TrackType, updates: Partial<BeatTrack>) => {
    setBeatData(prev => {
      const currentTrack = prev.tracks[trackType];
      return {
        ...prev,
        tracks: {
          ...prev.tracks,
          [trackType]: {
            ...currentTrack,
            ...updates,
          },
        },
      };
    });
  };

  // 1. Cook Fresh Beat
  const refreshSessionLibrary = async () => {
    const result = await sessionService.list();
    setSessionLibrary(result.sessions);
    setInvalidSessionCount(result.invalidCount);
  };

  const saveSessionNow = async () => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setSessionSaveStatus('saving');
    const snapshot = latestSnapshotRef.current;
    try {
      const saved = await sessionService.saveCurrent(currentSessionRef.current, {
        config: snapshot.config, beatData: snapshot.beatData, masterVolume: snapshot.masterVolume,
        referenceDNA: snapshot.referenceDNA, studioKitReference: sessionKitReferenceRef.current,
        variations: variationSnapshotsRef.current,
      });
      setCurrentSession(saved);
      setSessionSaveStatus('saved');
      await refreshSessionLibrary();
      showToast('Session saved');
    } catch (error) {
      setSessionSaveStatus('unsaved');
      throw error;
    }
  };

  const openSession = async (id: string) => {
    if (currentSessionRef.current && sessionSaveStatus !== 'saved') await saveSessionNow();
    const saved = await sessionService.load(id);
    const restored = saved.variations[saved.selectedVariation]!;
    let missingKit = false;
    let sampleWarning = false;
    if (saved.studioKitReference) {
      try { sampleWarning = (await studioKitService.selectKit(saved.studioKitReference)).length > 0; }
      catch { missingKit = true; await studioKitService.selectKit(null); }
    } else await studioKitService.selectKit(null);
    skipAutosaveRef.current = true;
    setConfig(saved.generatorSettings);
    setBeatData(restored);
    setReferenceDNA(saved.referenceDNA ?? restored.referenceDNA);
    setMasterVolume(saved.masterVolume);
    audioEngine.setMasterVolume(saved.masterVolume);
    setSessionKitReference(saved.studioKitReference);
    variationSnapshotsRef.current = saved.variations;
    setCurrentSession(saved);
    setSessionSaveStatus('saved');
    setShowSessionLibrary(false);
    await refreshSessionLibrary();
    if (missingKit) showToast('Session opened; its Studio Kit is missing, so built-in sounds are active.');
    else if (sampleWarning) showToast('Some saved samples are unavailable; built-in sounds are active for those lanes.');
    else showToast(`Opened ${saved.name}`);
  };

  const handleNewCookup = async () => {
    if (currentSessionRef.current && sessionSaveStatus !== 'saved') await saveSessionNow();
    const newSeed = Math.floor(Math.random() * 900000 + 100000);
    const newConfig: BeatConfig = {
      ...config,
      seed: newSeed,
      variation: 'V1',
      kickFamilyId: Math.floor(Math.random() * 44) + 1,
      hatFamilyId: Math.floor(Math.random() * 22) + 1,
      bassFamilyId: Math.floor(Math.random() * 10) + 1,
      phraseFamilyId: Math.floor(Math.random() * 10) + 1,
    };
    const siblings = generateVariationSet(newConfig, referenceDNA);
    const newBeat = siblings.V1;
    variationSnapshotsRef.current = siblings;
    setConfig(newConfig);
    setBeatData(newBeat);
    const created = await sessionService.saveCurrent(null, {
      config: newConfig, beatData: newBeat, masterVolume,
      referenceDNA, studioKitReference: studioKitService.getActiveKitId(),
      variations: siblings,
    });
    setSessionKitReference(created.studioKitReference);
    setCurrentSession(created);
    setSessionSaveStatus('saved');
    skipAutosaveRef.current = true;
    showToast(`Cooked new session (Seed #${newSeed})`);
    await refreshSessionLibrary();
  };

  const duplicateSession = async (id: string) => {
    if (currentSessionRef.current && sessionSaveStatus !== 'saved') await saveSessionNow();
    const source = await sessionService.load(id);
    const duplicate = await sessionService.createDuplicate(source);
    await openSession(duplicate.id);
    await refreshSessionLibrary();
    showToast(`Saved copy: ${duplicate.name}`);
  };

  const renameSession = async (id: string, name: string) => {
    const renamed = await sessionService.rename(id, name);
    if (currentSessionRef.current?.id === id) setCurrentSession(renamed);
    await refreshSessionLibrary();
  };

  const deleteSession = async (id: string) => {
    await sessionService.delete(id);
    if (currentSessionRef.current?.id === id) {
      setCurrentSession(null);
      setSessionSaveStatus('unsaved');
    }
    await refreshSessionLibrary();
  };

  // 2. Targeted Recook
  const handleRecook = (target: 'all' | 'drums' | 'bass808' | 'melody') => {
    if (target === 'all') {
      void handleNewCookup();
      return;
    }
    const targetKey = target === 'melody' ? 'music' : target === 'bass808' ? '808' : 'drums';
    setBeatData(previous => recookBeat(previous, targetKey));
    showToast(`Recooked ${target} stem in place`);
  };

  // 3. Apply Reference DNA Target
  const handleApplyReferenceTarget = (target: ReferenceTarget) => {
    setReferenceDNA(target);
    const newConfig: BeatConfig = {
      ...config,
      bpm: target.detectedBpm || config.bpm,
      density: target.kickDensity,
      darkness: target.darkness,
      vocalSpace: target.vocalSpace,
      bassMovement: target.bass808Activity,
      kickFamilyId: target.recommendedKickFamilyId !== undefined ? target.recommendedKickFamilyId : config.kickFamilyId,
      hatFamilyId: target.recommendedHatFamilyId !== undefined ? target.recommendedHatFamilyId : config.hatFamilyId,
      bassFamilyId: target.recommendedBassFamilyId !== undefined ? target.recommendedBassFamilyId : config.bassFamilyId,
      melodyPersonalityId: target.recommendedMelodyPersonalityId || config.melodyPersonalityId,
      swing: target.swing !== undefined ? target.swing : config.swing,
      rootKey: target.recommendedKey || config.rootKey,
      scale: target.recommendedScale || config.scale,
    };
    const siblings = generateVariationSet(newConfig, target);
    const newBeat = siblings[newConfig.variation];
    variationSnapshotsRef.current = siblings;
    setConfig(newConfig);
    setBeatData(newBeat);
    showToast(`Loaded Producer Reference: ${target.title}`);
  };

  const handleApplyDNA = (dna: ReferenceDNA, lockConstraints: boolean) => {
    setReferenceDNA(dna);
    if (lockConstraints) {
      const newConfig: BeatConfig = {
        ...config,
        bpm: dna.detectedBpm || config.bpm,
        density: dna.kickDensity,
        darkness: dna.darkness,
        vocalSpace: dna.vocalSpace,
        bassMovement: dna.bass808Activity,
        kickFamilyId: dna.recommendedKickFamilyId !== undefined ? dna.recommendedKickFamilyId : config.kickFamilyId,
        hatFamilyId: dna.recommendedHatFamilyId !== undefined ? dna.recommendedHatFamilyId : config.hatFamilyId,
        bassFamilyId: dna.recommendedBassFamilyId !== undefined ? dna.recommendedBassFamilyId : config.bassFamilyId,
        melodyPersonalityId: dna.recommendedMelodyPersonalityId || config.melodyPersonalityId,
        swing: dna.swing !== undefined ? dna.swing : config.swing,
        rootKey: dna.recommendedKey || config.rootKey,
        scale: dna.recommendedScale || config.scale,
      };
      const siblings = generateVariationSet(newConfig, dna);
      const newBeat = siblings[newConfig.variation];
      variationSnapshotsRef.current = siblings;
      setConfig(newConfig);
      setBeatData(newBeat);
    }
    showToast(`Reference DNA applied: ${dna.title || dna.sourceFileName}`);
  };

  const handleClearDNA = () => {
    setReferenceDNA(undefined);
    showToast('Reference DNA cleared');
  };

  // 4. Download Multi-Track MIDI
  const handleDownloadMidi = () => {
    try {
      const bytes = generateMidiFile(beatData);
      const blob = new Blob([bytes], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SlapDesk_${config.rootKey}_${config.bpm}BPM_${config.variation}_Seed${config.seed}.mid`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded multi-track Type 1 MIDI (.mid)');
    } catch (e: any) {
      alert(`MIDI export error: ${e.message}`);
    }
  };

  // 5. Download Project Bundle ZIP
  const handleDownloadZip = async () => {
    try {
      showToast('Packaging stems, MIDI & LLM tokens...');
      const zipBlob = await exportProjectZip(beatData);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SlapDesk_Session_Seed${config.seed}_${config.rootKey}_${config.bpm}BPM.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Project ZIP downloaded with individual stems!');
    } catch (e: any) {
      alert(`ZIP packaging error: ${e.message}`);
    }
  };

  const handleNavigateView = (view: DawView, track?: TrackType) => {
    setActiveView(view);
    if (track) setFocusedTrack(track);
  };

  if (isSessionBooting) {
    return <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-xs font-mono text-zinc-400">Restoring local Cookup…</div>;
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded-lg shadow-2xl animate-fade-in border border-amber-300">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* LMMS DAW Top Transport Bar */}
      <DawHeader
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onStop={handleStop}
        bpm={config.bpm}
        onBpmChange={newBpm => {
          const newConfig = { ...config, bpm: newBpm };
          setConfig(newConfig);
          setBeatData(prev => ({ ...prev, config: newConfig }));
        }}
        activeView={activeView}
        onViewChange={setActiveView}
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolumeChange}
        currentBar={currentBar}
        currentStep={currentStep}
        referenceDNA={referenceDNA}
        onOpenReferenceModal={() => setShowReferenceMode(true)}
        onOpenStudioKit={() => setShowStudioKit(true)}
        onOpenTestLab={() => setShowTestLab(true)}
        onOpenTokenLab={() => setShowTokenLab(true)}
        onOpenCodeViewer={() => setShowCodeViewer(true)}
        onDownloadMidi={handleDownloadMidi}
        onExportZip={handleDownloadZip}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewCookup={handleNewCookup}
        onOpenSessionLibrary={() => { setShowSessionLibrary(true); void refreshSessionLibrary(); }}
        onSaveSession={() => { void saveSessionNow().catch(error => showToast(error.message)); }}
        sessionSaveStatus={sessionSaveStatus}
      />

      {/* Main DAW Middle Workspace: Sidebar + Active Window */}
      <div className="flex-1 flex overflow-hidden">
        {/* LMMS Left Browser Sidebar */}
        <DawSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onApplyReference={handleApplyReferenceTarget}
          activeReferenceId={referenceDNA?.id}
          onOpenStudioKit={() => setShowStudioKit(true)}
          onOpenTestLab={() => setShowTestLab(true)}
          onOpenTokenLab={() => setShowTokenLab(true)}
          onOpenCodeViewer={() => setShowCodeViewer(true)}
          onDownloadMidi={handleDownloadMidi}
          onExportZip={handleDownloadZip}
        />

        {/* LMMS Central Workspace (View Dependent) */}
        <main className="flex-1 flex flex-col p-3 bg-zinc-950 overflow-hidden">
          {activeView === 'song_editor' && (
            <SongEditor
              beatData={beatData}
              onUpdateTrack={handleUpdateTrack}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onJumpToStep={handleJumpToStep}
              onNavigateView={handleNavigateView}
              onRecookTrack={handleRecook}
            />
          )}

          {activeView === 'beat_bassline' && (
            <BeatBasslineEditor
              beatData={beatData}
              onUpdateTrack={handleUpdateTrack}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onJumpToStep={handleJumpToStep}
            />
          )}

          {activeView === 'piano_roll' && (
            <PianoRoll
              beatData={beatData}
              onUpdateTrack={handleUpdateTrack}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onJumpToStep={handleJumpToStep}
              initialTrack={focusedTrack}
            />
          )}

          {activeView === 'mixer' && (
            <FxMixer
              beatData={beatData}
              onUpdateTrack={handleUpdateTrack}
              masterVolume={masterVolume}
              onMasterVolumeChange={handleMasterVolumeChange}
              currentStep={currentStep}
              isPlaying={isPlaying}
            />
          )}

          {activeView === 'generator' && (
            <DawGeneratorView
              config={config}
              onConfigChange={newConfig => {
                const siblings = generateVariationSet(newConfig, referenceDNA);
                const newBeat = siblings[newConfig.variation];
                variationSnapshotsRef.current = siblings;
                setConfig(newConfig);
                setBeatData(newBeat);
              }}
              beatData={beatData}
              onNewCookup={handleNewCookup}
              onRecook={handleRecook}
              referenceDNA={referenceDNA}
              onOpenReferenceModal={() => setShowReferenceMode(true)}
            />
          )}
        </main>
      </div>

      {/* Production Modals */}
      <StudioKitModal
        isOpen={showStudioKit}
        onClose={() => {
          setShowStudioKit(false);
          const activeKitId = studioKitService.getActiveKitId();
          setSessionKitReference(activeKitId);
          sessionKitReferenceRef.current = activeKitId;
          setStudioKitRevision(value => value + 1);
        }}
      />

      <SessionLibraryModal
        isOpen={showSessionLibrary}
        onClose={() => setShowSessionLibrary(false)}
        sessions={sessionLibrary}
        currentSessionId={currentSession?.id ?? null}
        saveStatus={sessionSaveStatus}
        invalidCount={invalidSessionCount}
        onRefresh={refreshSessionLibrary}
        onOpen={openSession}
        onNew={handleNewCookup}
        onSave={saveSessionNow}
        onDuplicate={duplicateSession}
        onRename={renameSession}
        onDelete={deleteSession}
      />

      <ReferenceModeModal
        isOpen={showReferenceMode}
        onClose={() => setShowReferenceMode(false)}
        currentDNA={referenceDNA}
        onApplyDNA={handleApplyDNA}
        onClearDNA={handleClearDNA}
      />

      <TestLabModal
        isOpen={showTestLab}
        onClose={() => setShowTestLab(false)}
      />

      <TokenLabModal
        isOpen={showTokenLab}
        onClose={() => setShowTokenLab(false)}
        beatData={beatData}
      />

      <CodeViewerModal
        isOpen={showCodeViewer}
        onClose={() => setShowCodeViewer(false)}
      />
    </div>
  );
}

function createEmptyBeatData(config: BeatConfig): BeatData {
  const names: Record<TrackType, { name: string; channel: number }> = {
    melody: { name: 'Pain Loop', channel: 0 }, keys: { name: 'Dark Keys & Stabs', channel: 1 },
    bass808: { name: '808 Sub & Glides', channel: 2 }, kick: { name: 'Punch Kick Knock', channel: 9 },
    snare: { name: 'Hard Clap & Snare', channel: 9 }, hihat: { name: 'Sizzle Hats & Perc', channel: 9 },
  };
  const tracks = Object.fromEntries(Object.entries(names).map(([id, value]) => [id, {
    id, ...value, notes: [], muted: false, solo: false,
  }])) as BeatData['tracks'];
  return {
    config,
    recookCounts: {},
    tracks,
    barStructure: Array.from({ length: 8 }, (_, barIndex) => ({ barIndex, role: 'A' as const, description: 'Restoring cookup' })),
  };
}
