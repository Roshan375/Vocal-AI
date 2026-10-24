export interface FillerItem {
  word: string;
  count: number;
}

export interface SpeechMetrics {
  wordCount: number;
  fillerCount: number;
  fillerPercentage: number;
  pacingWPM: number;
  clarityScore: number;
}

export interface AuditResult {
  metrics: SpeechMetrics;
  fillerBreakdown: FillerItem[];
  rawTranscript: string;
  refinedScript: string;
  petersonAudit: string;
  screenplayVersion: string;
}

export interface ServerHealth {
  status: string;
  hasGeminiKey: boolean;
  hasFishAudioKey: boolean;
}
