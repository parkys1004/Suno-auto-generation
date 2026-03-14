export interface Song {
  id: string;
  title: string;
  image_url: string;
  lyric: string;
  audio_url: string;
  video_url: string;
  created_at: string;
  model_name: string;
  status: string;
  tags?: string;
  duration?: string;
  taskId?: string;
  isFavorite?: boolean;
  wav_url?: string;
}

export interface GeneratedPrompt {
  id: string;
  title: string;
  lyrics: string;
  tags: string;
  style_prompt?: string;
  created_at: string;
}

export interface Tag {
  id: string;
  label: string;
}
