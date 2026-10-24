import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, UploadCloud, RefreshCw, Volume2, AlertCircle, FileAudio, BookOpen } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob) => void;
  title: string;
  subtitle: string;
  minDurationSeconds?: number;
  sampleScript?: string;
  badgeLabel?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  title,
  subtitle,
  minDurationSeconds = 3,
  sampleScript,
  badgeLabel,
}) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSampleText, setShowSampleText] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Live volume visualization
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (audioErr) {
        console.warn('AudioContext visualization setup warning:', audioErr);
      }

      // Check supported mime types
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
        onAudioReady(audioBlob);
        setHasRecorded(true);

        // Cleanup stream tracks
        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setAudioLevel(0);
      };

      recorder.start(250);
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(
        'Microphone access was denied or is unavailable. Please grant permission or use file upload.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      if (duration < minDurationSeconds) {
        setErrorMessage(`Recording should be at least ${minDurationSeconds} seconds for reliable acoustic calibration.`);
        // Allow user to continue recording
        return;
      }
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onAudioReady(file);
      setHasRecorded(true);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col relative transition-all duration-300 hover:border-slate-700/80">
      {badgeLabel && (
        <span className="absolute top-4 right-4 text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {badgeLabel}
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          {title}
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
      </div>

      {sampleScript && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowSampleText(!showSampleText)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showSampleText ? 'Hide calibration script' : 'Show suggested speech passage to read'}
          </button>
          {showSampleText && (
            <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 italic leading-relaxed font-serif">
              "{sampleScript}"
            </div>
          )}
        </div>
      )}

      {/* Pulsing indicator with live audio volume rings */}
      <div className="relative my-4 flex justify-center items-center">
        {recording && (
          <div
            className="absolute rounded-full bg-rose-500/20 transition-all duration-75 pointer-events-none"
            style={{
              width: `${110 + audioLevel * 0.7}px`,
              height: `${110 + audioLevel * 0.7}px`,
            }}
          />
        )}
        <div
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 shadow-inner ${
            recording
              ? 'bg-rose-950/40 border-rose-500 text-rose-400 shadow-rose-900/40'
              : hasRecorded
              ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}
        >
          {recording ? (
            <div className="flex flex-col items-center">
              <span className="font-mono text-sm font-bold">{formatTime(duration)}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 mt-0.5 animate-pulse">
                REC
              </span>
            </div>
          ) : hasRecorded ? (
            <Volume2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <Mic className="w-8 h-8 text-indigo-400" />
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 w-full mt-2">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-medium text-sm flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/25"
          >
            <Mic className="w-4 h-4" /> {hasRecorded ? 'Re-record Voice' : 'Record Mic'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-medium text-sm flex items-center justify-center gap-2 transition animate-pulse shadow-md shadow-rose-600/25"
          >
            <Square className="w-4 h-4" /> Stop Recording ({formatTime(duration)})
          </button>
        )}

        <label
          className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 cursor-pointer transition"
          title="Upload Audio File (wav, mp3, m4a, webm)"
        >
          <UploadCloud className="w-4 h-4" />
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preview player */}
      {hasRecorded && previewUrl && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <FileAudio className="w-3.5 h-3.5" /> Sample Captured
            </span>
            <span className="font-mono text-slate-400">Ready for analysis</span>
          </div>
          <audio controls src={previewUrl} className="w-full h-8 rounded-lg" />
        </div>
      )}
    </div>
  );
};
