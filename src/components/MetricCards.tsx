import React from 'react';
import { SpeechMetrics, FillerItem } from '../types.ts';
import { Activity, Gauge, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MetricCardsProps {
  metrics: SpeechMetrics;
  fillerBreakdown: FillerItem[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, fillerBreakdown }) => {
  const getClarityStatus = (score: number) => {
    if (score >= 85) return { label: 'Rhetorically Commandable', color: 'text-emerald-400', bg: 'bg-emerald-950/60' };
    if (score >= 70) return { label: 'Articulate with Minor Static', color: 'text-indigo-400', bg: 'bg-indigo-950/60' };
    if (score >= 55) return { label: 'Frequent Hesitancy / Hedges', color: 'text-amber-400', bg: 'bg-amber-950/60' };
    return { label: 'Significant Verbal Crutching', color: 'text-rose-400', bg: 'bg-rose-950/60' };
  };

  const getPacingStatus = (wpm: number) => {
    if (wpm < 115) return { label: 'Lethargic / Excessive Drag', tag: 'Slow' };
    if (wpm <= 165) return { label: 'Optimal Deliberate Cadence', tag: 'Optimal' };
    return { label: 'Rushed / Nervous Acceleration', tag: 'Fast' };
  };

  const clarity = getClarityStatus(metrics.clarityScore);
  const pacing = getPacingStatus(metrics.pacingWPM);
  const efficiency = Math.max(0, Math.min(100, Math.round((1 - metrics.fillerCount / (metrics.wordCount || 1)) * 100)));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Clarity Score */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rhetorical Clarity</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {metrics.clarityScore}
            </span>
            <span className="text-slate-500 text-xs font-mono">/ 100</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                metrics.clarityScore >= 75 ? 'bg-emerald-500' : metrics.clarityScore >= 55 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${metrics.clarityScore}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${clarity.bg} ${clarity.color}`}>
            {clarity.label}
          </span>
        </div>
      </div>

      {/* Card 2: Filler Word Density */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-slate-700 transition">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filler Density</span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {metrics.fillerPercentage.toFixed(1)}%
            </span>
            <span className="text-slate-400 text-xs">
              ({metrics.fillerCount} {metrics.fillerCount === 1 ? 'crutch' : 'crutches'})
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, metrics.fillerPercentage * 5)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 flex-wrap">
          {fillerBreakdown.length > 0 ? (
            fillerBreakdown.slice(0, 3).map((f) => (
              <span
                key={f.word}
                className="text-[10px] bg-rose-950/70 text-rose-300 border border-rose-900/60 px-2 py-0.5 rounded-md font-mono"
              >
                "{f.word}": {f.count}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Zero filler crutches detected
            </span>
          )}
        </div>
      </div>

      {/* Card 3: Pacing (WPM) */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-slate-700 transition">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Speaking Cadence</span>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {metrics.pacingWPM}
            </span>
            <span className="text-slate-400 text-xs font-mono">WPM</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden relative">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (metrics.pacingWPM / 200) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">{pacing.label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 font-mono border border-sky-900/50">
            {pacing.tag}
          </span>
        </div>
      </div>

      {/* Card 4: Word Count & Efficiency */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl hover:border-slate-700 transition">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verbal Efficiency</span>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {efficiency}%
            </span>
            <span className="text-slate-400 text-xs font-mono">({metrics.wordCount} words)</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${efficiency}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Signal-to-Noise Ratio</span>
          <span className="font-mono text-purple-300">
            {metrics.wordCount - metrics.fillerCount} substantive words
          </span>
        </div>
      </div>
    </div>
  );
};
