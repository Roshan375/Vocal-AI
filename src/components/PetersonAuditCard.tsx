import React, { useState } from 'react';
import { Flame, Copy, Check, Volume2, ShieldAlert, Sparkles } from 'lucide-react';

interface PetersonAuditCardProps {
  auditText: string;
  onSpeakAudit?: (text: string) => void;
  isSpeaking?: boolean;
}

export const PetersonAuditCard: React.FC<PetersonAuditCardProps> = ({
  auditText,
  onSpeakAudit,
  isSpeaking,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(auditText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derive subtle rhetorical diagnosis tags from content
  const tags: string[] = [];
  const lower = auditText.toLowerCase();
  if (lower.includes('silence') || lower.includes('pause')) tags.push('Fear of Silence');
  if (lower.includes('basically') || lower.includes('you know') || lower.includes('crutch')) tags.push('Verbal Hedging');
  if (lower.includes('conviction') || lower.includes('authority')) tags.push('Erosion of Conviction');
  if (lower.includes('vague') || lower.includes('defensive')) tags.push('Defensive Ambiguity');
  if (tags.length === 0) tags.push('Rhetorical Architecture');

  return (
    <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-900/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 rounded-xl text-amber-400 shadow-md">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-amber-200 font-bold text-base tracking-wide">
                Rhetorical Conviction Audit
              </h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Jordan Peterson Diagnostic
              </span>
            </div>
            <p className="text-xs text-amber-300/70 mt-0.5">
              Unfiltered critique of intellectual authority, cadence, and verbal self-sabotage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSpeakAudit && (
            <button
              onClick={() => onSpeakAudit(auditText)}
              disabled={isSpeaking}
              className="px-3 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 text-xs flex items-center gap-1.5 transition font-medium"
              title="Hear Jordan Peterson Diagnostic read aloud"
            >
              {isSpeaking ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b border-amber-300" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              {isSpeaking ? 'Voicing...' : 'Hear Diagnostic'}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center transition"
            title="Copy audit to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Audit Text */}
      <div className="mt-5 relative">
        <blockquote className="text-slate-200 text-sm md:text-[15px] leading-relaxed italic font-serif pl-5 border-l-2 border-amber-500/70">
          "{auditText}"
        </blockquote>
      </div>

      {/* Diagnosis Tags */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-amber-400" /> Diagnostic Focus:
        </span>
        {tags.map((t) => (
          <span
            key={t}
            className="text-[11px] px-2.5 py-1 rounded-md bg-amber-950/50 text-amber-300/90 border border-amber-800/40 font-mono"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};
