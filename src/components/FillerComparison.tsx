import React, { useState } from 'react';
import {
  FileText,
  Volume2,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  Sparkles,
  Sliders,
  RefreshCw,
  Mic,
} from 'lucide-react';
import { FillerItem } from '../types.ts';

interface FillerComparisonProps {
  rawTranscript: string;
  refinedScript: string;
  fillerBreakdown: FillerItem[];
  rawAudioUrl: string | null;
  synthesizedAudioUrl: string | null;
  modelId: string | null;
  isSynthesizing: boolean;
  onReSynthesize: (selectedVoice: string) => void;
  onOpenScreenplay: () => void;
}

export const FillerComparison: React.FC<FillerComparisonProps> = ({
  rawTranscript,
  refinedScript,
  fillerBreakdown,
  rawAudioUrl,
  synthesizedAudioUrl,
  modelId,
  isSynthesizing,
  onReSynthesize,
  onOpenScreenplay,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr'>('Fenrir');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedRefined, setCopiedRefined] = useState(false);
  const [isPlayingRaw, setIsPlayingRaw] = useState(false);
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);

  const copyText = (text: string, isRaw: boolean) => {
    navigator.clipboard.writeText(text);
    if (isRaw) {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } else {
      setCopiedRefined(true);
      setTimeout(() => setCopiedRefined(false), 2000);
    }
  };

  // Highlight filler words in raw transcript
  const renderHighlightedRawTranscript = () => {
    if (!rawTranscript) return null;
    const fillerWords = fillerBreakdown.map((f) => f.word.toLowerCase());
    if (fillerWords.length === 0) {
      return <span>{rawTranscript}</span>;
    }

    // Sort longest first so multi-word like "you know" matches before "you"
    const sortedWords = [...fillerWords].sort((a, b) => b.length - a.length);
    const escaped = sortedWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');

    const parts = rawTranscript.split(regex);
    return parts.map((part, index) => {
      const match = sortedWords.some((w) => w.toLowerCase() === part.toLowerCase());
      if (match) {
        return (
          <mark
            key={index}
            className="bg-rose-500/25 text-rose-300 border border-rose-500/40 px-1 py-0.5 rounded font-bold not-italic"
            title="Verbal Crutch / Filler"
          >
            {part}
          </mark>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Highlight deliberate cues in refined script e.g. [pause]
  const renderHighlightedRefinedScript = () => {
    if (!refinedScript) return null;
    const parts = refinedScript.split(/(\[.*?\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={index}
            className="inline-block mx-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-semibold"
            title="Intentional Cadence Indicator"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Verbatim Speech */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Verbatim Raw Speech (With Static)
                </span>
              </div>
              <button
                onClick={() => copyText(rawTranscript, true)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                title="Copy raw transcript"
              >
                {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRaw ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="text-xs md:text-sm text-slate-300 leading-relaxed font-mono bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 min-h-[170px] max-h-[300px] overflow-y-auto selection:bg-rose-900 selection:text-white">
              {renderHighlightedRawTranscript()}
            </div>
          </div>

          {/* Raw audio player */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-rose-400" /> Original Recording Playback
            </span>
            {rawAudioUrl ? (
              <audio
                controls
                src={rawAudioUrl}
                onPlay={() => setIsPlayingRaw(true)}
                onPause={() => setIsPlayingRaw(false)}
                className="w-full h-8 rounded-lg"
              />
            ) : (
              <div className="text-xs text-slate-500 italic py-1 bg-slate-950/40 rounded-lg px-3">
                No local audio track attached (transcribed from sample)
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Refined Flawless Master Script */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Refined Flawless Script (Cadence Engineered)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenScreenplay}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Screenplay View
                </button>
                <button
                  onClick={() => copyText(refinedScript, false)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                  title="Copy refined script"
                >
                  {copiedRefined ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedRefined ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="text-xs md:text-sm text-slate-200 leading-relaxed font-mono bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 min-h-[170px] max-h-[300px] overflow-y-auto selection:bg-emerald-900 selection:text-white">
              {renderHighlightedRefinedScript()}
            </div>
          </div>

          {/* Voice synthesis controls */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-xs text-slate-400">Voice Timbre Persona:</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as any)}
                  className="text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                >
                  <option value="Fenrir">Fenrir (Authoritative & Deep Rhetoric)</option>
                  <option value="Charon">Charon (Measured & Stoic Executive)</option>
                  <option value="Zephyr">Zephyr (Warm & Persuasive Keynote)</option>
                  <option value="Puck">Puck (Energetic & Sharp Agility)</option>
                  <option value="Kore">Kore (Clear, Poised & Articulate)</option>
                </select>
              </div>

              {/* Synthesize Button */}
              <button
                type="button"
                onClick={() => onReSynthesize(selectedVoice)}
                disabled={isSynthesizing}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg ${
                  isSynthesizing
                    ? 'bg-indigo-900 text-indigo-300 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-indigo-600/30'
                }`}
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing Speech...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Re-Synthesize in Refined Voice</span>
                  </>
                )}
              </button>
            </div>

            {/* Synthesized audio playback bar */}
            {synthesizedAudioUrl && (
              <div className="p-3 bg-indigo-950/30 border border-indigo-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Flawless Synthesis Ready</span>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                  <audio
                    controls
                    autoPlay
                    src={synthesizedAudioUrl}
                    onPlay={() => setIsPlayingSynth(true)}
                    onPause={() => setIsPlayingSynth(false)}
                    className="w-full h-8 rounded-lg"
                  />
                  <a
                    href={synthesizedAudioUrl}
                    download="VocalRefine_Master_Speech.wav"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Download Synthesized Audio"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
