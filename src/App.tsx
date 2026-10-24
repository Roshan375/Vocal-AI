import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AudioRecorder } from './components/AudioRecorder.tsx';
import { MetricCards } from './components/MetricCards.tsx';
import { PetersonAuditCard } from './components/PetersonAuditCard.tsx';
import { ScreenplayModal } from './components/ScreenplayModal.tsx';
import { FillerComparison } from './components/FillerComparison.tsx';
import { AuditResult, ServerHealth } from './types.ts';
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  Headphones,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

const CALIBRATION_SAMPLE_PASSAGE =
  "To speak with genuine clarity is to take responsibility for the precision of your words. Every hesitation, every retreat into vague colloquialism, is an admission that you do not trust your own mind. Stand upright, confront the silence, and let your propositions bear the burden of proof.";

export const App: React.FC = () => {
  // Server capabilities
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);

  // Step 1 State: Calibration
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelProvider, setModelProvider] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationSuccessMessage, setCalibrationSuccessMessage] = useState<string | null>(null);

  // Step 2 State: Audit
  const [auditData, setAuditData] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [rawAudioUrl, setRawAudioUrl] = useState<string | null>(null);

  // Step 3 State: Re-Synthesis
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedAudioUrl, setSynthesizedAudioUrl] = useState<string | null>(null);
  const [isSpeakingPeterson, setIsSpeakingPeterson] = useState(false);

  // Modal State
  const [isScreenplayOpen, setIsScreenplayOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    // Check backend health and API configuration
    axios
      .get<ServerHealth>('/api/health')
      .then((res) => setServerHealth(res.data))
      .catch((err) => console.warn('Server health check error:', err));
  }, []);

  const showNotice = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 6000);
  };

  // Step 1: Submit Calibration Voice
  const handleCalibrationAudio = async (blob: Blob) => {
    setIsCalibrating(true);
    setCalibrationSuccessMessage(null);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'calibration.wav');

      const response = await axios.post('/api/calibrate-voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setModelId(response.data.modelId);
      setModelProvider(response.data.provider);
      setCalibrationSuccessMessage(response.data.message);
      showNotice('Voice calibration completed successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Voice calibration failed.';
      showNotice(`Calibration failed: ${errMsg}`, 'error');
    } finally {
      setIsCalibrating(false);
    }
  };

  // Step 2: Submit Speech for Analysis
  const handleSpeechAudio = async (blob: Blob) => {
    setIsAuditing(true);
    const audioUrl = URL.createObjectURL(blob);
    setRawAudioUrl(audioUrl);
    setSynthesizedAudioUrl(null);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'speech.wav');

      const response = await axios.post('/api/audit-speech', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAuditData(response.data.audit);
      showNotice('Speech audit completed! Analysis ready below.', 'success');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Speech audit failed.';
      showNotice(`Audit failed: ${errMsg}`, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  // Load interactive demo sample data
  const handleLoadDemoSample = async () => {
    try {
      setIsAuditing(true);
      const response = await axios.get('/api/sample-audit');
      setAuditData(response.data);
      if (!modelId) {
        setModelId('demo_vocal_model_7x');
        setModelProvider('neural-timbre-profile');
      }
      showNotice('Sample engineering audit loaded! Explore the metrics and re-synthesize.', 'success');
    } catch (err: any) {
      showNotice('Failed to load demo sample.', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  // Step 3: Trigger Voice Re-Synthesis
  const handleReSynthesize = async (voiceName: string = 'Fenrir') => {
    if (!auditData?.refinedScript) {
      showNotice('No refined script available to synthesize.', 'error');
      return;
    }

    setIsSynthesizing(true);
    try {
      const response = await axios.post(
        '/api/resynthesize',
        {
          script: auditData.refinedScript,
          modelId: modelId || 'default_voice_profile',
          voiceName: voiceName,
        },
        { responseType: 'blob' }
      );

      const contentType = String(response.headers['content-type'] || 'audio/wav');
      const audioBlob = new Blob([response.data], { type: contentType });
      const synthUrl = URL.createObjectURL(audioBlob);
      setSynthesizedAudioUrl(synthUrl);
      showNotice('Voice re-synthesis complete! Ready to listen.', 'success');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Speech re-synthesis failed.';
      showNotice(`Synthesis failed: ${errMsg}`, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Peterson diagnostic speech synthesis
  const handleSpeakPetersonAudit = async (text: string) => {
    if (isSpeakingPeterson) return;
    setIsSpeakingPeterson(true);
    try {
      const response = await axios.post(
        '/api/resynthesize',
        {
          script: text,
          voiceName: 'Fenrir',
          forceGemini: true,
        },
        { responseType: 'blob' }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsSpeakingPeterson(false);
      audio.onerror = () => setIsSpeakingPeterson(false);
      await audio.play();
    } catch (err: any) {
      console.error(err);
      setIsSpeakingPeterson(false);
      showNotice('Could not play diagnostic speech.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl border text-sm flex items-start gap-3 transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
              : 'bg-rose-950 border-rose-800 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 border border-indigo-400/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl leading-tight tracking-tight text-white">
                  VocalRefine AI
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold">
                  S2.1 & Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Jordan Peterson Rhetoric Coach & Voice Synthesizer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Demo button */}
            <button
              onClick={handleLoadDemoSample}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition font-medium"
              title="Quickly test with realistic sample speech"
            >
              <PlayCircle className="w-3.5 h-3.5 text-indigo-400" /> Test With Sample Speech
            </button>

            {/* Model status pill */}
            {modelId ? (
              <span className="flex items-center gap-1.5 text-xs bg-emerald-950/70 border border-emerald-800/70 text-emerald-300 px-3 py-1.5 rounded-full font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Voice Profile: <strong className="text-emerald-200">{modelId.slice(0, 10)}...</strong>
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs bg-amber-950/70 border border-amber-800/70 text-amber-300 px-3 py-1.5 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Voice Not Calibrated
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-indigo-950/30 via-slate-900 to-slate-900/50 border border-indigo-900/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm md:text-base font-bold text-indigo-200 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-indigo-400" /> Flawless Communication Engine
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Eliminate "um", "like", "basically", and hesitancy. Record your baseline timbre to clone your voice, speak your raw thoughts, receive an unapologetic rhetorical audit, and hear a re-synthesized version of your speech in your refined voice.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400 font-mono bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Multimodal Cadence Active</span>
          </div>
        </div>

        {/* Step 1 & Step 2 Ingestion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Voice Calibration */}
          <div className="relative">
            <AudioRecorder
              title="Step 1: Voice Calibration & Acoustic Profile"
              subtitle="Record a clean 15-30s reading sample to capture your acoustic timbre."
              badgeLabel="TIMBRE CLONING"
              minDurationSeconds={5}
              sampleScript={CALIBRATION_SAMPLE_PASSAGE}
              onAudioReady={handleCalibrationAudio}
            />
            {isCalibrating && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-20 p-6 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mb-3" />
                <p className="text-sm font-bold text-indigo-200">Processing Acoustic Profile...</p>
                <p className="text-xs text-indigo-400/80 font-mono mt-1">
                  Normalizing to 16kHz mono WAV & registering timbre model
                </p>
              </div>
            )}
            {calibrationSuccessMessage && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 px-3 py-1 bg-emerald-950/30 rounded-lg border border-emerald-900/40">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{calibrationSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Step 2: Spontaneous Speech Capture */}
          <div className="relative">
            <AudioRecorder
              title="Step 2: Spontaneous Speech Capture"
              subtitle="Speak your unfiltered thoughts. Um's, pauses, and verbal crutches will be dissected."
              badgeLabel="RHETORIC AUDIT"
              minDurationSeconds={3}
              onAudioReady={handleSpeechAudio}
            />
            {isAuditing && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-20 p-6 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mb-3" />
                <p className="text-sm font-bold text-indigo-200">Auditing Vocal Cadence with Gemini 3.8...</p>
                <p className="text-xs text-indigo-400/80 font-mono mt-1">
                  Extracting fillers, calculating WPM, and drafting Jordan Peterson diagnosis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Audit Results Presentation */}
        {auditData ? (
          <div className="space-y-8 animate-fade-in">
            {/* Section heading */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-400" /> Communication Audit & Metrics
                </h3>
                <p className="text-xs text-slate-400">
                  Quantitative and qualitative evaluation of verbal conviction
                </p>
              </div>
              <button
                onClick={() => setIsScreenplayOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 font-semibold transition"
              >
                <span>View Screenplay Adaptation</span>
              </button>
            </div>

            {/* Metric Overview Cards */}
            <MetricCards
              metrics={auditData.metrics}
              fillerBreakdown={auditData.fillerBreakdown}
            />

            {/* Jordan Peterson Diagnostic */}
            <PetersonAuditCard
              auditText={auditData.petersonAudit}
              onSpeakAudit={handleSpeakPetersonAudit}
              isSpeaking={isSpeakingPeterson}
            />

            {/* Step 3: Script Comparison & Voice Re-Synthesis */}
            <FillerComparison
              rawTranscript={auditData.rawTranscript}
              refinedScript={auditData.refinedScript}
              fillerBreakdown={auditData.fillerBreakdown}
              rawAudioUrl={rawAudioUrl}
              synthesizedAudioUrl={synthesizedAudioUrl}
              modelId={modelId}
              isSynthesizing={isSynthesizing}
              onReSynthesize={handleReSynthesize}
              onOpenScreenplay={() => setIsScreenplayOpen(true)}
            />
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-full text-slate-400">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">Ready for Speech Ingestion</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Record or upload your audio above, or click "Test With Sample Speech" to explore the Jordan Peterson rhetorical diagnosis and voice synthesis engine.
            </p>
            <button
              onClick={handleLoadDemoSample}
              className="mt-2 text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
            >
              <PlayCircle className="w-4 h-4" /> Load Sample Speech & Audit
            </button>
          </div>
        )}

        {/* Screenplay Adaptation Modal */}
        {auditData && (
          <ScreenplayModal
            isOpen={isScreenplayOpen}
            onClose={() => setIsScreenplayOpen(false)}
            screenplayText={auditData.screenplayVersion}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">VocalRefine AI</span>
            <span>•</span>
            <span>Speech Flaw Eradication & Timbre Synthesis</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Fish Audio S2.1</span>
            <span>•</span>
            <span>Gemini 3.8 Multimodal</span>
            <span>•</span>
            <span>FFmpeg 16kHz</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
