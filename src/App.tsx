import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Loader2, Search, ArrowUp
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';

import { Song, GeneratedPrompt, Tag } from './types';

import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { NowPlaying } from './components/NowPlaying';
import { MusicLibrary } from './components/MusicLibrary';
import { PromptLibrary } from './components/PromptLibrary';
import { GenerationForm } from './components/GenerationForm';

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const libraryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (libraryScrollRef.current) {
        setShowScrollTop(libraryScrollRef.current.scrollTop > 300);
      }
    };

    const scrollContainer = libraryScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    libraryScrollRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('suno_api_key') || '');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('suno_base_url') || 'https://api.sunoapi.org/api/v1');
  
  // Form States
  const [description, setDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [genres, setGenres] = useState<Tag[]>([]);

  const [subGenres, setSubGenres] = useState<Tag[]>([{ id: '1', label: 'Lo-fi' }]);

  const [musicType, setMusicType] = useState<'vocal' | 'instrumental'>('vocal');
  
  const [vocalTypes, setVocalTypes] = useState<Tag[]>([]);

  const [vocalGenders, setVocalGenders] = useState<Tag[]>([]);

  const [tempo, setTempo] = useState(80);
  
  const [moods, setMoods] = useState<Tag[]>([{ id: '1', label: '차분한' }]);

  const [instruments, setInstruments] = useState<Tag[]>([]);

  const [mainLanguage, setMainLanguage] = useState('한국어');
  const [subLanguage, setSubLanguage] = useState('');
  const [subLanguageRatio, setSubLanguageRatio] = useState(30);
  const [model, setModel] = useState('V5');
  
  const [excludedElements, setExcludedElements] = useState<Tag[]>([
    { id: '1', label: '허밍 (humming)' },
    { id: '2', label: '긴 인트로 (long intro)' }
  ]);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [genCount, setGenCount] = useState(1);
  const [lyricsLengthWithSpaces, setLyricsLengthWithSpaces] = useState(800);
  const [lyricsLengthWithoutSpaces, setLyricsLengthWithoutSpaces] = useState(400);
  const [savePath, setSavePath] = useState(() => localStorage.getItem('save_path') || 'K:\\@수노기러기');
  const [dirHandle, setDirHandle] = useState<any>(null);

  // App States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('generated_songs');
    return saved ? JSON.parse(saved) : [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSettings = () => {
    const settings = {
      description,
      genres,
      subGenres,
      musicType,
      vocalTypes,
      vocalGenders,
      tempo,
      moods,
      instruments,
      mainLanguage,
      subLanguage,
      subLanguageRatio,
      model,
      excludedElements,
      additionalRequest,
      genCount,
      lyricsLengthWithSpaces,
      lyricsLengthWithoutSpaces
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suno-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.description !== undefined) setDescription(settings.description);
        if (settings.genres) setGenres(settings.genres);
        if (settings.subGenres) setSubGenres(settings.subGenres);
        if (settings.musicType) setMusicType(settings.musicType);
        if (settings.vocalTypes) setVocalTypes(settings.vocalTypes);
        if (settings.vocalGenders) setVocalGenders(settings.vocalGenders);
        if (settings.tempo) setTempo(settings.tempo);
        if (settings.moods) setMoods(settings.moods);
        if (settings.instruments) setInstruments(settings.instruments);
        if (settings.mainLanguage) setMainLanguage(settings.mainLanguage);
        if (settings.subLanguage !== undefined) setSubLanguage(settings.subLanguage);
        if (settings.subLanguageRatio !== undefined) setSubLanguageRatio(settings.subLanguageRatio);
        if (settings.model) setModel(settings.model);
        if (settings.excludedElements) setExcludedElements(settings.excludedElements);
        if (settings.additionalRequest !== undefined) setAdditionalRequest(settings.additionalRequest);
        if (settings.genCount) setGenCount(settings.genCount);
        if (settings.lyricsLengthWithSpaces) setLyricsLengthWithSpaces(settings.lyricsLengthWithSpaces);
        if (settings.lyricsLengthWithoutSpaces) setLyricsLengthWithoutSpaces(settings.lyricsLengthWithoutSpaces);
        
        alert('설정이 성공적으로 적용되었습니다.');
      } catch (err) {
        alert('잘못된 설정 파일입니다.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>(() => {
    const saved = localStorage.getItem('generated_prompts');
    return saved ? JSON.parse(saved) : [];
  });
  const [libraryTab, setLibraryTab] = useState<'music' | 'prompts'>('music');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isAutoSetting, setIsAutoSetting] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editPromptData, setEditPromptData] = useState({ title: '', style_prompt: '', lyrics: '' });
  const [isGeneratingWav, setIsGeneratingWav] = useState<Record<string, boolean>>({});
  const [wavPollingTasks, setWavPollingTasks] = useState<Record<string, string>>({});
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'complete' | 'favorite'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Audio Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // API Settings Modal State
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [promptModel, setPromptModel] = useState<'chatgpt' | 'gemini'>(() => localStorage.getItem('prompt_model') as 'chatgpt' | 'gemini' || 'gemini');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [chatgptApiKey, setChatgptApiKey] = useState(() => localStorage.getItem('chatgpt_api_key') || '');



  const handleSelectFolder = async () => {
    // Check if running in an iframe
    if (window.self !== window.top) {
      const openNewTab = window.confirm(
        '미리보기 화면(iframe)에서는 브라우저 보안 정책상 컴퓨터의 폴더를 선택할 수 없습니다.\n\n새 탭에서 앱을 열고 다시 시도하시겠습니까?'
      );
      if (openNewTab) {
        window.open(window.location.href, '_blank');
      }
      return;
    }

    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });
        setDirHandle(handle);
        setSavePath(`[선택됨] ${handle.name}`);
      } else {
        alert('이 브라우저에서는 폴더 선택 기능을 지원하지 않습니다. 경로를 직접 입력해주세요.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('폴더 선택 에러:', err);
        alert('폴더를 선택하는 중 오류가 발생했습니다.');
      }
    }
  };

  const handleGenerateWav = async (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    if (!song.id) return;
    
    setIsGeneratingWav(prev => ({ ...prev, [song.id]: true }));
    try {
      const response = await axios.post('/api/suno/wav/generate', {
        apiKey,
        baseUrl,
        taskId: song.taskId || song.id,
        audioId: song.id,
        callBackUrl: ''
      });
      
      if (response.data) {
        alert('WAV 변환 요청이 시작되었습니다. 완료 시 다운로드 버튼이 활성화됩니다.');
        setWavPollingTasks(prev => ({ ...prev, [song.id]: song.taskId || song.id }));
      } else {
        setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'WAV 변환 요청에 실패했습니다.');
      setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
    }
  };

  const handleDownload = async (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    if (!song.audio_url) return;
    
    const safeTitle = (song.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}.mp3`;

    try {
      if (dirHandle) {
        // 직접 폴더에 저장
        const response = await fetch(song.audio_url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        alert(`'${fileName}' 파일이 성공적으로 저장되었습니다.`);
      } else {
        throw new Error('No directory handle');
      }
    } catch (err) {
      // 일반 다운로드 폴백 (Blob을 이용해 파일명 강제 지정)
      try {
        const response = await fetch(song.audio_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (fetchErr) {
        // Fetch 실패 시 최후의 수단
        const a = document.createElement('a');
        a.href = song.audio_url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  const handleDownloadWav = async (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    if (!song.wav_url) return;
    
    const safeTitle = (song.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}.wav`;

    try {
      if (dirHandle) {
        // 직접 폴더에 저장
        const response = await fetch(song.wav_url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        alert(`'${fileName}' 파일이 성공적으로 저장되었습니다.`);
      } else {
        throw new Error('No directory handle');
      }
    } catch (err) {
      // 일반 다운로드 폴백 (Blob을 이용해 파일명 강제 지정)
      try {
        const response = await fetch(song.wav_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (fetchErr) {
        // Fetch 실패 시 최후의 수단
        const a = document.createElement('a');
        a.href = song.wav_url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  // Save settings
  useEffect(() => {
    localStorage.setItem('suno_api_key', apiKey);
    localStorage.setItem('suno_base_url', baseUrl);
    localStorage.setItem('prompt_model', promptModel);
    localStorage.setItem('gemini_api_key', geminiApiKey);
    localStorage.setItem('chatgpt_api_key', chatgptApiKey);
    localStorage.setItem('save_path', savePath);
  }, [apiKey, baseUrl, promptModel, geminiApiKey, chatgptApiKey, savePath]);

  useEffect(() => {
    localStorage.setItem('generated_prompts', JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem('generated_songs', JSON.stringify(songs));
  }, [songs]);

  const playSong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Polling logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (taskIds.length > 0 && isGenerating) {
      intervalId = setInterval(async () => {
        for (const currentTaskId of taskIds) {
          try {
            const response = await axios.get(`/api/suno/status/${currentTaskId}?baseUrl=${encodeURIComponent(baseUrl)}`, {
              headers: { Authorization: `Bearer ${apiKey}` }
            });
            
            let data = response.data;
            if (data && data.code === 200) {
              data = data.data;
            }
            
            if (data) {
              const status = data.status;
              const sunoData = data.response?.sunoData || [];
              
              if (status === 'SUCCESS' || status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS') {
                setSongs(prev => {
                  const updated = [...prev];
                  // Only take the first 2 songs as requested by the user
                  sunoData.slice(0, 2).forEach((newSong: any) => {
                    const mappedSong: Song = {
                      id: newSong.id,
                      title: newSong.title,
                      image_url: newSong.imageUrl,
                      lyric: newSong.prompt,
                      audio_url: newSong.audioUrl,
                      video_url: '',
                      created_at: newSong.createTime,
                      model_name: newSong.modelName,
                      status: status === 'SUCCESS' ? 'complete' : 'streaming',
                      tags: newSong.tags,
                      duration: newSong.duration?.toString(),
                      taskId: currentTaskId
                    };
                    const idx = updated.findIndex(s => s.id === mappedSong.id);
                    if (idx !== -1) updated[idx] = mappedSong;
                    else updated.unshift(mappedSong);
                  });
                  return updated;
                });
                
                if (status === 'SUCCESS') {
                  setTaskIds(prev => {
                    const newIds = prev.filter(id => id !== currentTaskId);
                    if (newIds.length === 0 && !isRequesting) setIsGenerating(false);
                    return newIds;
                  });
                  
                  // Automatically download if directory handle is available
                  if (dirHandle) {
                    sunoData.forEach(async (newSong: any) => {
                      if (newSong.audioUrl) {
                        try {
                          const response = await fetch(newSong.audioUrl);
                          if (!response.ok) throw new Error('Network response was not ok');
                          const blob = await response.blob();
                          
                          const safeTitle = (newSong.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
                          const fileName = `${safeTitle}.mp3`;
                          
                          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
                          const writable = await fileHandle.createWritable();
                          await writable.write(blob);
                          await writable.close();
                          
                          console.log(`Auto-downloaded: ${fileName}`);
                        } catch (err) {
                          console.error('Auto-download failed:', err);
                        }
                      }
                    });
                  }
                }
              } else if (status === 'CREATE_TASK_FAILED' || status === 'GENERATE_AUDIO_FAILED' || status === 'CALLBACK_EXCEPTION' || status === 'SENSITIVE_WORD_ERROR') {
                setError(prev => prev ? `${prev}\n음악 생성 중 오류가 발생했습니다: ${data.errorMessage || status}` : `음악 생성 중 오류가 발생했습니다: ${data.errorMessage || status}`);
                setTaskIds(prev => {
                  const newIds = prev.filter(id => id !== currentTaskId);
                  if (newIds.length === 0 && !isRequesting) setIsGenerating(false);
                  return newIds;
                });
              }
            }
          } catch (err) {
            console.error('Status check error:', err);
          }
        }
      }, 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [taskIds, isGenerating, apiKey, baseUrl]);

  // WAV Polling logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const taskIds = Object.keys(wavPollingTasks);
    
    if (taskIds.length > 0) {
      intervalId = setInterval(async () => {
        for (const songId of taskIds) {
          const tId = wavPollingTasks[songId];
          try {
            const response = await axios.get(`/api/suno/status/${tId}?baseUrl=${encodeURIComponent(baseUrl)}`, {
              headers: { Authorization: `Bearer ${apiKey}` }
            });
            
            let data = response.data;
            if (data && data.code === 200) {
              data = data.data;
            }
            
            if (data) {
              const sunoData = data.response?.sunoData || [];
              const songData = sunoData.find((s: any) => s.id === songId);
              
              if (songData) {
                const wavUrl = songData.wavUrl || (songData.audioUrl?.endsWith('.wav') ? songData.audioUrl : null);
                if (wavUrl) {
                  setSongs(prev => prev.map(s => s.id === songId ? { ...s, wav_url: wavUrl } : s));
                  setWavPollingTasks(prev => {
                    const newTasks = { ...prev };
                    delete newTasks[songId];
                    return newTasks;
                  });
                  setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
                } else if (data.status === 'FAILED' || data.status === 'CREATE_TASK_FAILED' || data.status === 'GENERATE_AUDIO_FAILED') {
                  setWavPollingTasks(prev => {
                    const newTasks = { ...prev };
                    delete newTasks[songId];
                    return newTasks;
                  });
                  setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
                  alert(`WAV 변환 실패: ${data.errorMessage || '알 수 없는 오류'}`);
                }
              }
            }
          } catch (err) {
            console.error('WAV Status check error:', err);
          }
        }
      }, 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [wavPollingTasks, apiKey, baseUrl]);

  const handleGeneratePrompt = async (shouldSwitchTab: boolean = true): Promise<GeneratedPrompt | null> => {
    if (promptModel === 'gemini' && !geminiApiKey) {
      setError('Gemini API 키를 설정에서 입력해주세요.');
      return null;
    }
    if (promptModel === 'chatgpt' && !chatgptApiKey) {
      setError('ChatGPT API 키를 설정에서 입력해주세요.');
      return null;
    }
    
    setIsGeneratingPrompt(true);
    setError('');

    const allTags = [
      ...genres.map(t => t.label),
      ...subGenres.map(t => t.label),
      musicType === 'instrumental' ? 'instrumental' : '',
      ...vocalTypes.map(t => t.label),
      ...vocalGenders.map(t => t.label),
      `${tempo}bpm`,
      ...moods.map(t => t.label),
      ...instruments.map(t => t.label),
      subLanguage ? `${mainLanguage} ${100 - subLanguageRatio}%, ${subLanguage} ${subLanguageRatio}%` : mainLanguage,
      ...excludedElements.map(t => `no ${t.label}`)
    ].filter(Boolean).join(', ');

    const lengthDescription = `공백 포함 약 ${lyricsLengthWithSpaces}자, 공백 제외 약 ${lyricsLengthWithoutSpaces}자 내외의 분량 (지정된 장르에 최적화된 구조 적용)`;

    const systemPrompt = `당신은 전문적인 음악 작사가이자 프로듀서입니다. 다음 설정을 바탕으로 음악의 제목, 가사, 그리고 Suno AI에 입력할 최적화된 '스타일 프롬프트(Style Prompt)'를 작성해주세요.

설명: ${description}
추가 요청사항: ${additionalRequest}
선택된 기본 태그: ${allTags}
요청된 가사 길이: ${lengthDescription}

[가사 작성 가이드]
- 지정된 장르의 가장 대중적이고 최적화된 곡 구조(Intro-Verse-Chorus-Bridge-Outro)를 자동으로 적용하여 약 3분 내외의 곡이 되도록 충분한 분량의 가사를 작성하세요.
- 반드시 각 단락 앞에 메타 태그(예: [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro], [Guitar Solo], [Drop] 등)를 포함하여 Suno AI가 곡의 흐름을 이해할 수 있게 하세요.
- 곡 중간의 모든 지시문(예: [Emotional], [Whispering], [Build-up], [Fast], [Slow] 등)과 악기 연주 지시도 반드시 대괄호 []를 사용하여 작성하세요.
- 장르의 특성(리듬, 라임, 감정선)을 살려 작사하세요.
- 기악곡(Instrumental)인 경우 가사 대신 "[Instrumental]" 이라고만 작성하세요.

[Suno AI 스타일 프롬프트 작성 가이드]
- 선택된 기본 태그와 설명을 바탕으로 Suno AI가 가장 잘 이해할 수 있는 음악 장르, 무드, 악기, 보컬 스타일 등을 쉼표로 구분하여 영문으로 작성하세요.
- 특히 선택된 주요 악기(${instruments.map(t => t.label).join(', ')}) 소리가 곡 전체에서 잘 들리고 강조되도록 프롬프트에 포함하세요. (예: prominent piano, leading electric guitar, heavy bass 등)
- 최대 120자를 넘지 않도록 핵심 키워드 위주로 간결하게 작성하세요.

반드시 다음 JSON 형식으로 응답해주세요:
{
  "title": "음악 제목",
  "lyrics": "가사 내용 (메타 태그 포함, 장르에 최적화된 구조)",
  "style_prompt": "Suno AI용 영문 스타일 프롬프트"
}`;

    try {
      let title = '';
      let lyrics = '';
      let style_prompt = '';

      if (promptModel === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          }
        });
        const data = JSON.parse(response.text || '{}');
        title = data.title || '제목 없음';
        lyrics = data.lyrics || '가사 없음';
        style_prompt = data.style_prompt || allTags;
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${chatgptApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: 'json_object' }
          })
        });
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        title = parsed.title || '제목 없음';
        lyrics = parsed.lyrics || '가사 없음';
        style_prompt = parsed.style_prompt || allTags;
      }

      const newPrompt: GeneratedPrompt = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        lyrics,
        tags: allTags,
        style_prompt,
        created_at: new Date().toISOString()
      };

      setPrompts(prev => [newPrompt, ...prev]);
      if (shouldSwitchTab) setLibraryTab('prompts');
      return newPrompt;
    } catch (err: any) {
      setError('프롬프트 생성 중 오류가 발생했습니다: ' + (err.message || ''));
      return null;
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleAutoSetup = async () => {
    if (!description.trim()) {
      setError('음악 설명을 먼저 입력해주세요.');
      return;
    }

    if (promptModel === 'gemini' && !geminiApiKey) {
      setError('Gemini API 키를 설정에서 입력해주세요.');
      return;
    }
    if (promptModel === 'chatgpt' && !chatgptApiKey) {
      setError('ChatGPT API 키를 설정에서 입력해주세요.');
      return;
    }

    setIsAutoSetting(true);
    setError('');

    const systemPrompt = `당신은 전문적인 음악 프로듀서입니다. 사용자가 입력한 음악 설명을 바탕으로 Suno AI 음악 생성을 위한 최적의 설정을 제안해주세요.
    
설명: ${description}

반드시 다음 JSON 형식으로 응답해주세요:
{
  "genres": ["장르1", "장르2"],
  "subGenres": ["세부장르1"],
  "moods": ["분위기1", "분위기2"],
  "instruments": ["악기1", "악기2"],
  "vocalGenders": ["남성", "여성" 또는 "없음"],
  "vocalTypes": ["보컬스타일1"],
  "musicType": "vocal" 또는 "instrumental",
  "tempo": 80,
  "mainLanguage": "한국어",
  "lyricsLengthWithSpaces": 800,
  "lyricsLengthWithoutSpaces": 400
}

* 장르, 세부장르, 분위기, 악기, 보컬스타일은 한국어로 작성해주세요.
* vocalGenders는 "남성", "여성", "남녀 듀엣" 등으로 제안해주세요.
* tempo는 숫자로만 제안해주세요 (예: 120).
* musicType은 보컬이 있으면 "vocal", 연주곡이면 "instrumental"로 제안해주세요.
* lyricsLengthWithSpaces와 lyricsLengthWithoutSpaces는 숫자로 제안해주세요.`;

    try {
      let data;
      if (promptModel === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          }
        });
        data = JSON.parse(response.text || '{}');
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${chatgptApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: 'json_object' }
          })
        });
        const resData = await response.json();
        data = JSON.parse(resData.choices[0].message.content);
      }

      if (data) {
        if (data.genres) setGenres(data.genres.map((g: string) => ({ id: Math.random().toString(), label: g })));
        if (data.subGenres) setSubGenres(data.subGenres.map((g: string) => ({ id: Math.random().toString(), label: g })));
        if (data.moods) setMoods(data.moods.map((m: string) => ({ id: Math.random().toString(), label: m })));
        if (data.instruments) setInstruments(data.instruments.map((i: string) => ({ id: Math.random().toString(), label: i })));
        if (data.vocalGenders) setVocalGenders(data.vocalGenders.map((g: string) => ({ id: Math.random().toString(), label: g })));
        if (data.vocalTypes) setVocalTypes(data.vocalTypes.map((v: string) => ({ id: Math.random().toString(), label: v })));
        if (data.musicType) setMusicType(data.musicType);
        if (data.tempo) setTempo(data.tempo);
        if (data.mainLanguage) setMainLanguage(data.mainLanguage);
        if (data.lyricsLengthWithSpaces) setLyricsLengthWithSpaces(data.lyricsLengthWithSpaces);
        if (data.lyricsLengthWithoutSpaces) setLyricsLengthWithoutSpaces(data.lyricsLengthWithoutSpaces);
        
        setShowAdvanced(true);
      }
    } catch (err: any) {
      setError('자동 설정 중 오류가 발생했습니다: ' + (err.message || ''));
    } finally {
      setIsAutoSetting(false);
    }
  };

  const handleSavePrompt = (id: string) => {
    setPrompts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, title: editPromptData.title, style_prompt: editPromptData.style_prompt, lyrics: editPromptData.lyrics }
        : p
    ));
    setEditingPromptId(null);
  };

  const togglePromptSelection = (id: string) => {
    setSelectedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAllPrompts = () => {
    const allIds = prompts.map(p => p.id);
    setSelectedPrompts(prev => {
      if (prev.size === allIds.length && allIds.every(id => prev.has(id))) {
        return new Set();
      }
      return new Set(allIds);
    });
  };

  const selectTodayPrompts = () => {
    const today = new Date().toDateString();
    const todayIds = prompts
      .filter(p => new Date(p.created_at).toDateString() === today)
      .map(p => p.id);
    
    if (todayIds.length === 0) return;

    setSelectedPrompts(prev => {
      const isAllTodaySelected = todayIds.every(id => prev.has(id)) && prev.size === todayIds.length;
      if (isAllTodaySelected) {
        return new Set();
      }
      return new Set(todayIds);
    });
  };

  const selectRecentPrompts = () => {
    const oneHourAgo = new Date().getTime() - 1000 * 60 * 60;
    const recentIds = prompts
      .filter(p => new Date(p.created_at).getTime() > oneHourAgo)
      .map(p => p.id);
    
    if (recentIds.length === 0) return;

    setSelectedPrompts(prev => {
      const isAllRecentSelected = recentIds.every(id => prev.has(id)) && prev.size === recentIds.length;
      if (isAllRecentSelected) {
        return new Set();
      }
      return new Set(recentIds);
    });
  };

  const handleGenerateFromPrompt = async (promptToUse: GeneratedPrompt) => {
    if (!apiKey) {
      setError('API 키를 입력해주세요.');
      return;
    }

    setError('');
    setIsGenerating(true);
    setIsRequesting(true);
    setGenerationProgress({ current: 0, total: genCount });
    setLibraryTab('music'); // Switch to music tab to see the result

    try {
      let gender = '';
      if (vocalGenders.some(t => t.label.includes('여성') || t.label.toLowerCase().includes('female'))) {
        gender = 'f';
      } else if (vocalGenders.some(t => t.label.includes('남성') || t.label.toLowerCase().includes('male'))) {
        gender = 'm';
      }

      for (let i = 0; i < genCount; i++) {
        setGenerationProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Add request number to the title for clarity
        const requestTitle = promptToUse.title;

        const response = await axios.post('/api/suno/generate', {
          apiKey,
          baseUrl,
          prompt: promptToUse.lyrics,
          tags: promptToUse.style_prompt || promptToUse.tags,
          title: requestTitle,
          make_instrumental: musicType === 'instrumental',
          negativeTags: excludedElements.map(t => t.label).join(', '),
          vocalGender: gender,
          model: model
        });
        
        if (response.data?.code === 200 && response.data?.data?.taskId) {
          setTaskIds(prev => [...prev, response.data.data.taskId]);
        } else if (response.data?.code && response.data.code !== 200) {
          setError(prev => prev ? `${prev}\nAPI Error: ${response.data.code}` : `API Error: ${response.data.code}`);
        } else if (response.data && response.data.length > 0) {
          const slicedData = response.data.slice(0, 2);
          setSongs(prev => [...slicedData, ...prev]);
          const ids = slicedData.map((s: any) => s.id).join(',');
          setTaskIds(prev => [...prev, ids]);
        } else if (response.data && response.data.task_id) {
          setTaskIds(prev => [...prev, response.data.task_id]);
        }

        // Add a small delay between requests if genCount > 1
        if (genCount > 1 && i < genCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '음악 생성 요청에 실패했습니다.');
      // Only stop generating if no tasks were successfully started
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (promptModel === 'gemini' && !geminiApiKey) {
      setError('Gemini API 키를 설정에서 입력해주세요.');
      return;
    }
    if (promptModel === 'chatgpt' && !chatgptApiKey) {
      setError('ChatGPT API 키를 설정에서 입력해주세요.');
      return;
    }

    setIsGeneratingPrompt(true);
    setLibraryTab('prompts');
    
    try {
      for (let i = 0; i < genCount; i++) {
        await handleGeneratePrompt(i === 0); // Only switch tab on the first one
        if (genCount > 1 && i < genCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (err) {
      console.error('Prompt batch generation error:', err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('API 키를 입력해주세요.');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    setIsRequesting(true);
    setGenerationProgress({ current: 0, total: genCount });
    setLibraryTab('music'); // Switch to music tab to see the result

    try {
      let gender = '';
      if (vocalGenders.some(t => t.label.includes('여성') || t.label.toLowerCase().includes('female'))) {
        gender = 'f';
      } else if (vocalGenders.some(t => t.label.includes('남성') || t.label.toLowerCase().includes('male'))) {
        gender = 'm';
      }

      for (let i = 0; i < genCount; i++) {
        setGenerationProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Generate a new unique prompt for each iteration
        const promptToUse = await handleGeneratePrompt(false);
        if (!promptToUse) continue;
        
        // Add request number to the title for clarity
        const requestTitle = promptToUse.title;
        
        // Ensure we stay on the music tab
        setLibraryTab('music');

        const response = await axios.post('/api/suno/generate', {
          apiKey,
          baseUrl,
          prompt: promptToUse.lyrics,
          tags: promptToUse.style_prompt || promptToUse.tags,
          title: requestTitle,
          make_instrumental: musicType === 'instrumental',
          negativeTags: excludedElements.map(t => t.label).join(', '),
          vocalGender: gender,
          model: model
        });
        
        if (response.data?.code === 200 && response.data?.data?.taskId) {
          setTaskIds(prev => [...prev, response.data.data.taskId]);
        } else if (response.data?.code && response.data.code !== 200) {
          setError(prev => prev ? `${prev}\nAPI Error: ${response.data.code}` : `API Error: ${response.data.code}`);
        } else if (response.data && response.data.length > 0) {
          const slicedData = response.data.slice(0, 2);
          setSongs(prev => [...slicedData, ...prev]);
          const ids = slicedData.map((s: any) => s.id).join(',');
          setTaskIds(prev => [...prev, ids]);
        } else if (response.data && response.data.task_id) {
          setTaskIds(prev => [...prev, response.data.task_id]);
        }

        // Add a small delay between requests if genCount > 1
        if (genCount > 1 && i < genCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '음악 생성 요청에 실패했습니다.');
      // Only stop generating if no tasks were successfully started
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleBatchGenerate = async () => {
    if (!apiKey) {
      setError('API 키를 입력해주세요.');
      return;
    }
    
    const promptsToGenerate = prompts.filter(p => selectedPrompts.has(p.id));
    if (promptsToGenerate.length === 0) return;

    setError('');
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: promptsToGenerate.length });
    setLibraryTab('music');
    
    let newTaskIds: string[] = [];
    let hasError = false;

    let currentIdx = 0;
    for (const promptToUse of promptsToGenerate) {
      currentIdx++;
      setGenerationProgress(prev => ({ ...prev, current: currentIdx }));
      try {
        let gender = '';
        if (vocalGenders.some(t => t.label.includes('여성') || t.label.toLowerCase().includes('female'))) {
          gender = 'f';
        } else if (vocalGenders.some(t => t.label.includes('남성') || t.label.toLowerCase().includes('male'))) {
          gender = 'm';
        }

        const response = await axios.post('/api/suno/generate', {
          apiKey,
          baseUrl,
          prompt: promptToUse.lyrics,
          tags: promptToUse.style_prompt || promptToUse.tags,
          title: promptToUse.title,
          make_instrumental: musicType === 'instrumental',
          negativeTags: excludedElements.map(t => t.label).join(', '),
          vocalGender: gender,
          model: model
        });
        
        if (response.data?.code === 200 && response.data?.data?.taskId) {
          newTaskIds.push(response.data.data.taskId);
        } else if (response.data?.code && response.data.code !== 200) {
          setError(prev => prev ? `${prev}\nAPI Error: ${response.data.code}` : `API Error: ${response.data.code}`);
          hasError = true;
        } else if (response.data && response.data.length > 0) {
          // Only take the first 2 songs as requested by the user
          const slicedData = response.data.slice(0, 2);
          setSongs(prev => [...slicedData, ...prev]);
          const ids = slicedData.map((s: any) => s.id).join(',');
          newTaskIds.push(ids);
        } else if (response.data && response.data.task_id) {
          newTaskIds.push(response.data.task_id);
        } else {
          setError(prev => prev ? `${prev}\n예상치 못한 응답 형식입니다.` : '예상치 못한 응답 형식입니다.');
          hasError = true;
        }
      } catch (err: any) {
        setError(prev => prev ? `${prev}\n음악 생성 요청에 실패했습니다.` : '음악 생성 요청에 실패했습니다.');
        hasError = true;
      }
      
      // Add a small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (newTaskIds.length > 0) {
      setTaskIds(prev => [...prev, ...newTaskIds]);
    } else if (hasError) {
      setIsGenerating(false);
    }
    
    setSelectedPrompts(new Set());
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSongs(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleDelete = (id: string) => {
    if (confirm('정말로 이 음악을 삭제하시겠습니까?')) {
      setSongs(prev => prev.filter(s => s.id !== id));
      if (currentSong?.id === id) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
    }
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleExtend = (song: Song) => {
    alert('확장 기능은 아직 준비 중입니다.');
  };

  const removeTag = (setFn: React.Dispatch<React.SetStateAction<Tag[]>>, id: string) => {
    setFn(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-primary)]/30 flex flex-col`}>
      {/* Header */}
      <Header 
        onOpenSettings={() => setIsApiModalOpen(true)} 
        theme={theme}
        toggleTheme={toggleTheme}
        onDownloadSettings={handleDownloadSettings}
        onUploadSettings={() => fileInputRef.current?.click()}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUploadSettings} 
        accept=".json" 
        className="hidden" 
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        <GenerationForm 
          description={description}
          setDescription={setDescription}
          handleAutoSetup={handleAutoSetup}
          isAutoSetting={isAutoSetting}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          genres={genres}
          setGenres={setGenres}
          subGenres={subGenres}
          setSubGenres={setSubGenres}
          musicType={musicType}
          setMusicType={setMusicType}
          vocalTypes={vocalTypes}
          setVocalTypes={setVocalTypes}
          vocalGenders={vocalGenders}
          setVocalGenders={setVocalGenders}
          tempo={tempo}
          setTempo={setTempo}
          moods={moods}
          setMoods={setMoods}
          instruments={instruments}
          setInstruments={setInstruments}
          mainLanguage={mainLanguage}
          setMainLanguage={setMainLanguage}
          subLanguage={subLanguage}
          setSubLanguage={setSubLanguage}
          subLanguageRatio={subLanguageRatio}
          setSubLanguageRatio={setSubLanguageRatio}
          model={model}
          setModel={setModel}
          excludedElements={excludedElements}
          setExcludedElements={setExcludedElements}
          additionalRequest={additionalRequest}
          setAdditionalRequest={setAdditionalRequest}
          genCount={genCount}
          setGenCount={setGenCount}
          lyricsLengthWithSpaces={lyricsLengthWithSpaces}
          setLyricsLengthWithSpaces={setLyricsLengthWithSpaces}
          lyricsLengthWithoutSpaces={lyricsLengthWithoutSpaces}
          setLyricsLengthWithoutSpaces={setLyricsLengthWithoutSpaces}
          savePath={savePath}
          setSavePath={setSavePath}
          handleSelectFolder={handleSelectFolder}
          handleGeneratePrompts={handleGeneratePrompts}
          handleGenerate={handleGenerate}
          isGeneratingPrompt={isGeneratingPrompt}
          isGenerating={isGenerating}
          error={error}
          removeTag={removeTag}
        />

        {/* Middle Column: Library */}
        <div className="w-full lg:w-[40%] h-[600px] lg:h-auto border-b lg:border-b-0 lg:border-l lg:border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-primary)] shrink-0">
          <div className="p-6 border-b border-[var(--border-color)]">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6">
              <button 
                onClick={() => setLibraryTab('music')}
                className={`text-lg font-bold transition-colors ${libraryTab === 'music' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                음악 라이브러리
              </button>
              <button 
                onClick={() => setLibraryTab('prompts')}
                className={`text-lg font-bold transition-colors ${libraryTab === 'prompts' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                프롬프트 라이브러리
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={libraryTab === 'music' ? "음악 검색..." : "프롬프트 검색..."}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-11 pr-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]/50"
                />
              </div>
              
              {libraryTab === 'music' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
                    <button 
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      전체
                    </button>
                    <button 
                      onClick={() => setFilter('complete')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'complete' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      완료
                    </button>
                    <button 
                      onClick={() => setFilter('favorite')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === 'favorite' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      즐겨찾기
                    </button>
                  </div>

                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-[var(--accent-primary)]/50 text-[var(--text-secondary)]"
                  >
                    <option value="newest">최신순</option>
                    <option value="oldest">오래된순</option>
                    <option value="title">제목순</option>
                  </select>
                </div>
              )}

              {libraryTab === 'prompts' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
                    <button 
                      onClick={selectAllPrompts}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                    >
                      전체 선택
                    </button>
                    <button 
                      onClick={selectTodayPrompts}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                    >
                      오늘 생성
                    </button>
                  </div>

                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-[var(--accent-primary)]/50 text-[var(--text-secondary)]"
                  >
                    <option value="newest">최신순</option>
                    <option value="oldest">오래된순</option>
                    <option value="title">제목순</option>
                  </select>

                  {selectedPrompts.size > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => {
                          if (window.confirm(`${selectedPrompts.size}개의 프롬프트를 삭제하시겠습니까?`)) {
                            setPrompts(prev => prev.filter(p => !selectedPrompts.has(p.id)));
                            setSelectedPrompts(new Set());
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                      >
                        {selectedPrompts.size}개 삭제
                      </button>
                      <button 
                        onClick={handleBatchGenerate}
                        disabled={isGenerating}
                        className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-[var(--text-on-accent)] text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      >
                        <Music className="w-3.5 h-3.5" />
                        {selectedPrompts.size}개 일괄 생성
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div 
            ref={libraryScrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            {libraryTab === 'music' ? (
              <MusicLibrary 
                songs={songs}
                searchQuery={searchQuery}
                filter={filter}
                sortBy={sortBy}
                currentSong={currentSong}
                isPlaying={isPlaying}
                playSong={playSong}
                handleGenerateWav={handleGenerateWav}
                handleDownloadWav={handleDownloadWav}
                handleDownload={handleDownload}
                handleDelete={handleDelete}
                toggleFavorite={toggleFavorite}
                isGeneratingWav={isGeneratingWav}
              />
            ) : (
              <PromptLibrary 
                prompts={prompts}
                searchQuery={searchQuery}
                sortBy={sortBy}
                editingPromptId={editingPromptId}
                setEditingPromptId={setEditingPromptId}
                editPromptData={editPromptData}
                setEditPromptData={setEditPromptData}
                handleSavePrompt={handleSavePrompt}
                handleDeletePrompt={handleDeletePrompt}
                handleCopyPrompt={handleCopyPrompt}
                handleGenerateFromPrompt={handleGenerateFromPrompt}
                selectedPrompts={selectedPrompts}
                togglePromptSelection={togglePromptSelection}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>

        {/* Right Column: Now Playing */}
        <NowPlaying 
          currentSong={currentSong}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      </div>

      {/* API Settings Modal */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-md"
          >
            <div className="text-center space-y-6 max-w-sm w-full px-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-3xl shadow-2xl">
                  <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin mx-auto" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {generationProgress.total > 1 ? `[요청 ${generationProgress.current}] ` : ''}음악 생성 중...
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {generationProgress.total > 1 
                    ? `${generationProgress.total}회 요청 중 ${generationProgress.current}번째 요청을 처리하고 있습니다.`
                    : 'AI가 당신의 상상을 음악으로 만들고 있습니다.'}
                </p>
              </div>

              {generationProgress.total > 1 && (
                <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                  <motion.div 
                    className="h-full bg-[var(--accent-primary)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  />
                </div>
              )}

              <p className="text-[10px] text-[var(--text-secondary)] animate-pulse">
                잠시만 기다려 주세요. 보통 1~2분 정도 소요됩니다.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-full shadow-lg hover:bg-[var(--accent-hover)] transition-all active:scale-95 group"
            title="맨 위로 이동"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <SettingsModal 
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        promptModel={promptModel}
        setPromptModel={setPromptModel}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        chatgptApiKey={chatgptApiKey}
        setChatgptApiKey={setChatgptApiKey}
        apiKey={apiKey}
        setApiKey={setApiKey}
        baseUrl={baseUrl}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
      `}} />
    </div>
  );
}
