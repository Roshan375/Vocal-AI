import React, { useState } from 'react';
import { Film, X, Copy, Check, Download, Clapperboard } from 'lucide-react';

interface ScreenplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenplayText: string;
}

export const ScreenplayModal: React.FC<ScreenplayModalProps> = ({
  isOpen,
  onClose,
  screenplayText,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(screenplayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([screenplayText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'VocalRefine_Screenplay_Adaptation.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[88vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Screenplay Adaptation</h3>
              <p className="text-xs text-slate-400">Cinematic dramatization of your spoken conviction</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5 transition"
              title="Copy screenplay text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center transition"
              title="Download Screenplay File"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Script Content */}
        <div className="flex-1 overflow-y-auto mt-4 p-5 bg-slate-900/90 rounded-xl font-mono text-xs md:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner selection:bg-indigo-600 selection:text-white">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800/80 text-[11px] text-indigo-400 font-bold uppercase tracking-widest">
            <Clapperboard className="w-3.5 h-3.5" /> Scene Draft - Production Ready
          </div>
          {screenplayText}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Formatted with industry sluglines, character headings & parentheticals</span>
          <span className="font-mono text-[11px]">{screenplayText.length} characters</span>
        </div>
      </div>
    </div>
  );
};
