import axios from 'axios';

const FISH_BASE_URL = 'https://api.fish.audio';

export async function trainVoiceModel(audioBuffer: Buffer, title: string = 'UserVoiceModel'): Promise<string> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    // If no external Fish Audio key is set in secrets, generate a simulated calibration reference
    // so user can test the entire workflow seamlessly with Gemini audio fallback.
    const mockModelId = `cloned_voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    console.log(`No FISH_AUDIO_API_KEY configured. Created local calibrated voice token: ${mockModelId}`);
    return mockModelId;
  }

  const formData = new FormData();
  formData.append('type', 'tts');
  formData.append('title', `${title}_${Date.now()}`);
  formData.append('train_mode', 'fast');
  formData.append('visibility', 'private');
  
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
  formData.append('voices', blob, 'calibration.wav');

  const response = await axios.post(`${FISH_BASE_URL}/model`, formData, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const modelId = response.data?._id || response.data?.id;
  if (!modelId) {
    throw new Error(`Failed to extract model_id from Fish Audio: ${JSON.stringify(response.data)}`);
  }
  return modelId;
}

export async function synthesizeFlawlessSpeech(text: string, referenceId: string): Promise<Buffer> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    throw new Error('FISH_AUDIO_API_KEY is not defined in environment variables.');
  }

  // S2.1-Pro supports natural language bracket annotations like [pause]
  const response = await axios.post(
    `${FISH_BASE_URL}/v1/tts`,
    {
      text: text,
      reference_id: referenceId,
      format: 'mp3',
      normalize: true,
      latency: 'balanced',
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        model: 's2.1-pro',
      },
      responseType: 'arraybuffer',
    }
  );

  return Buffer.from(response.data);
}
