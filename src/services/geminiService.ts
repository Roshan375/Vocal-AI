import { GoogleGenAI, Type } from '@google/genai';

export interface AuditResult {
  metrics: {
    wordCount: number;
    fillerCount: number;
    fillerPercentage: number;
    pacingWPM: number;
    clarityScore: number;
  };
  fillerBreakdown: Array<{ word: string; count: number }>;
  rawTranscript: string;
  refinedScript: string;
  petersonAudit: string;
  screenplayVersion: string;
}

const auditResponseSchema = {
  type: Type.OBJECT,
  properties: {
    metrics: {
      type: Type.OBJECT,
      properties: {
        wordCount: { type: Type.INTEGER, description: 'Total number of spoken words transcribed.' },
        fillerCount: { type: Type.INTEGER, description: 'Total count of filler words and verbal crutches detected.' },
        fillerPercentage: { type: Type.NUMBER, description: 'Percentage of filler words relative to total words (0 to 100).' },
        pacingWPM: { type: Type.INTEGER, description: 'Estimated spoken words per minute cadence.' },
        clarityScore: { type: Type.INTEGER, description: 'Communication clarity and conviction score out of 100.' },
      },
      required: ['wordCount', 'fillerCount', 'fillerPercentage', 'pacingWPM', 'clarityScore'],
    },
    fillerBreakdown: {
      type: Type.ARRAY,
      description: 'List of specific filler words and their occurrence count.',
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          count: { type: Type.INTEGER },
        },
        required: ['word', 'count'],
      },
    },
    rawTranscript: {
      type: Type.STRING,
      description: 'Verbatim transcript capturing every hesitation, pause, and filler word.',
    },
    refinedScript: {
      type: Type.STRING,
      description: 'Flawless, articulate version stripped of all crutches, with intentional pacing and bracket cues like [pause] where appropriate.',
    },
    petersonAudit: {
      type: Type.STRING,
      description: 'Unapologetic, razor-sharp psychological & rhetorical diagnosis in the style of Jordan B. Peterson, analyzing where the speaker lacks conviction, hides behind verbal hedges, or abdicates authority.',
    },
    screenplayVersion: {
      type: Type.STRING,
      description: 'Screenplay scene adaptation transforming their core message into a dramatic, high-stakes film scene with scene headings, character names, and parentheticals.',
    },
  },
  required: [
    'metrics',
    'fillerBreakdown',
    'rawTranscript',
    'refinedScript',
    'petersonAudit',
    'screenplayVersion',
  ],
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function analyzeAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string = 'audio/wav'
): Promise<AuditResult> {
  const ai = getGeminiClient();

  const systemInstruction = `
You are VocalRefine AI, an elite multimodal speech coach and vocal dramatist combining exacting linguistic precision with Jordan Peterson's uncompromising rhetorical diagnosis.

Analyze the uploaded speech audio:
1. Transcribe the raw speech verbatim, capturing every stutter, false start, and verbal crutch ("um", "uh", "like", "basically", "you know", "kind of", "sort of", "literally", "actually").
2. Calculate exact metrics: word count, total filler count, filler percentage, approximate words-per-minute (pacingWPM), and an overall communication clarity score (0-100).
3. Generate a refined, flawless script: eliminate verbal static, elevate intellectual precision, and insert bracket cues such as [pause] or [deliberate emphasis] where cadence is required.
4. Provide the "Peterson Audit": Unapologetic, constructive rhetorical feedback analyzing where the speaker lacks conviction, retreats into defensive vagueness, or abdicates intellectual authority. Channel Jordan Peterson's distinct psychological cadence: "Notice how you hid behind 'basically'...", "You uttered that because you were terrified of the silence...", "Speak with the burden of truth."
5. Create a Screenplay Adaptation: Format the refined message into a crisp screenplay scene with scene headings (e.g. INT. BOARDROOM - NIGHT), character names, and parentheticals (e.g. (leaning forward, uncompromising)).

Output strictly valid JSON according to the schema provided.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: audioBuffer.toString('base64'),
              mimeType,
            },
          },
          {
            text: 'Carefully listen to this speech audio recording. Transcribe verbatim, audit filler words, measure pacing and clarity, write the Peterson audit, and generate both the refined master script and the screenplay adaptation.',
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: auditResponseSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return JSON.parse(text) as AuditResult;
  } catch (err: any) {
    console.error('Failed to parse Gemini JSON output:', text);
    throw new Error(`Failed to parse speech audit: ${err.message}`);
  }
}

/**
 * Synthesizes speech using Gemini 3.8 Flash TTS with authentic voice timbre.
 * Unary default returns a pristine 24kHz 16-bit mono WAV buffer.
 */
export async function synthesizeWithGeminiTTS(
  text: string,
  voiceName: 'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr' = 'Fenrir'
): Promise<Buffer> {
  const ai = getGeminiClient();

  // Strip brackets or bracket cues for clean pronunciation if needed
  const cleanedText = text.replace(/\[pause\]/gi, '... ').replace(/\[.*?\]/g, '');

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: cleanedText,
            speechMetadata: {
              style: 'Resonant, authoritative, measured, and exceptionally articulate.',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Gemini TTS did not return audio data.');
  }

  return Buffer.from(base64Audio, 'base64');
}
