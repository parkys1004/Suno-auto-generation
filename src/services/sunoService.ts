export interface SunoGenerateRequest {
  customMode?: boolean;
  instrumental?: boolean;
  model?: string;
  callBackUrl?: string;
  prompt?: string;
  style?: string;
  title?: string;
  personaId?: string;
  personaModel?: string;
  negativeTags?: string;
  vocalGender?: string;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    [key: string]: any;
  };
}

/**
 * Suno AI 음악 생성 API 호출
 * curl --request POST \
 *   --url https://api.sunoapi.org/api/v1/generate \
 *   --header 'Authorization: Bearer <token>' \
 *   --header 'Content-Type: application/json' \
 *   --data '{
 *     "customMode": true,
 *     "instrumental": true,
 *     "model": "V4_5ALL",
 *     "callBackUrl": "https://api.example.com/callback",
 *     "prompt": "A calm and relaxing piano track with soft melodies",
 *     "style": "Classical",
 *     "title": "Peaceful Piano Meditation",
 *     "personaId": "persona_123",
 *     "personaModel": "style_persona",
 *     "negativeTags": "Heavy Metal, Upbeat Drums",
 *     "vocalGender": "m",
 *     "styleWeight": 0.65,
 *     "weirdnessConstraint": 0.65,
 *     "audioWeight": 0.65
 *   }'
 */
export async function generateMusic(apiKey: string, data: SunoGenerateRequest): Promise<SunoGenerateResponse> {
  const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customMode: data.customMode ?? true,
      instrumental: data.instrumental ?? true,
      model: data.model ?? "V4_5ALL",
      callBackUrl: data.callBackUrl ?? "https://api.example.com/callback",
      prompt: data.prompt,
      style: data.style,
      title: data.title,
      personaId: data.personaId,
      personaModel: data.personaModel,
      negativeTags: data.negativeTags,
      vocalGender: data.vocalGender,
      styleWeight: data.styleWeight ?? 0.65,
      weirdnessConstraint: data.weirdnessConstraint ?? 0.65,
      audioWeight: data.audioWeight ?? 0.65
    })
  });

  if (response.status === 401) {
    console.error('Invalid API key, please check Authorization header');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || `Generation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 예시 데이터를 사용한 생성 함수
 */
export async function generateDefaultMusic(apiKey: string) {
  const defaultData: SunoGenerateRequest = {
    customMode: true,
    instrumental: true,
    model: "V4_5ALL",
    callBackUrl: "https://api.example.com/callback",
    prompt: "A calm and relaxing piano track with soft melodies",
    style: "Classical",
    title: "Peaceful Piano Meditation",
    personaId: "persona_123",
    personaModel: "style_persona",
    negativeTags: "Heavy Metal, Upbeat Drums",
    vocalGender: "m",
    styleWeight: 0.65,
    weirdnessConstraint: 0.65,
    audioWeight: 0.65
  };

  return generateMusic(apiKey, defaultData);
}
