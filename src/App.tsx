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

import { Check } from 'lucide-react';

export default function App() {
  // Beat Engine State
  const [config, setConfig] = useState<BeatConfig>(() => createDefaultConfig());
  const [beatData, setBeatData] = useState<BeatData>(() => generateFullBeat(config));
  const [referenceDNA, setReferenceDNA] = useState<ReferenceDNA | undefined>();

  // LMMS DAW Workspace State
  const [activeView, setActiveView] = useState<DawView>('song_editor');
  const [focusedTrack, setFocusedTrack] = useState<TrackType>('melody');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [masterVolume, setMasterVolume] = useState(0.85);

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
  const handleNewCookup = () => {
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
    const newBeat = generateFullBeat(newConfig, referenceDNA);
    setConfig(newConfig);
    setBeatData(newBeat);
    showToast(`Cooked new session (Seed #${newSeed})`);
  };

  // 2. Targeted Recook
  const handleRecook = (target: 'all' | 'drums' | 'bass808' | 'melody') => {
    if (target === 'all') {
      handleNewCookup();
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
    const newBeat = generateFullBeat(newConfig, target);
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
      const newBeat = generateFullBeat(newConfig, dna);
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
                const newBeat = generateFullBeat(newConfig, referenceDNA);
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
        onClose={() => setShowStudioKit(false)}
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
