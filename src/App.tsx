import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Loader2, Search, ArrowUp, Play, Pause
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { Song, GeneratedPrompt, Tag } from './types';

import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { NowPlaying } from './components/NowPlaying';
import { MusicLibrary } from './components/MusicLibrary';
import { PromptLibrary } from './components/PromptLibrary';
import { GenerationForm } from './components/GenerationForm';
import { ManualModal } from './components/ManualModal';

export default function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
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

  const sanitizeKey = (key: string | null) => {
    if (!key) return '';
    let sanitized = key.trim();
    if (sanitized.toLowerCase().startsWith('bearer ')) {
      sanitized = sanitized.slice(7).trim();
    }
    return sanitized;
  };

  const safeString = (val: any, fallback: string = ''): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (val === null || val === undefined) return fallback;
    
    // If it's an object, try to find a string property
    if (typeof val === 'object') {
      if (typeof val.label === 'string') return val.label;
      if (typeof val.name === 'string') return val.name;
      if (typeof val.text === 'string') return val.text;
      if (typeof val.value === 'string') return val.value;
      
      // If label/name/text/value exist but are not strings, recurse or stringify
      if (val.label) return safeString(val.label, fallback);
      if (val.name) return safeString(val.name, fallback);
      if (val.text) return safeString(val.text, fallback);
      if (val.value) return safeString(val.value, fallback);
    }
    
    try {
      const stringified = JSON.stringify(val);
      return stringified === '{}' ? fallback : stringified;
    } catch (e) {
      return fallback;
    }
  };

  const sanitizeTag = (val: any, maxLen: number = 30): string => {
    const str = safeString(val).trim();
    if (str.length > maxLen) {
      return str.substring(0, maxLen) + '...';
    }
    return str;
  };

  const [apiKey, setApiKey] = useState(() => sanitizeKey(localStorage.getItem('suno_api_key')));
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('suno_base_url') || 'https://api.sunoapi.org/api/v1');
  
  // Form States
  const [description, setDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [genres, setGenres] = useState<Tag[]>([]);

  const [subGenres, setSubGenres] = useState<Tag[]>([]);

  const [musicType, setMusicType] = useState<'vocal' | 'instrumental'>('vocal');
  
  const [vocalTypes, setVocalTypes] = useState<Tag[]>([]);

  const [vocalGenders, setVocalGenders] = useState<Tag[]>([]);

  const [tempo, setTempo] = useState(80);
  
  const [moods, setMoods] = useState<Tag[]>([]);

  const [instruments, setInstruments] = useState<Tag[]>([]);

  const [mainLanguage, setMainLanguage] = useState('한국어');
  const [subLanguage, setSubLanguage] = useState('');
  const [subLanguageRatio, setSubLanguageRatio] = useState(30);
  const [model, setModel] = useState('V5');
  
  const [excludedElements, setExcludedElements] = useState<Tag[]>([]);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [genCount, setGenCount] = useState(1);
  const [lyricsLengthWithSpaces, setLyricsLengthWithSpaces] = useState(800);
  const [lyricsLengthWithoutSpaces, setLyricsLengthWithoutSpaces] = useState(400);

  // App States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('generated_songs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing songs from localStorage:', e);
      return [];
    }
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResetForm = () => {
    if (window.confirm('모든 생성 설정을 초기화하시겠습니까?')) {
      setDescription('');
      setGenres([]);
      setSubGenres([]);
      setMusicType('vocal');
      setVocalTypes([]);
      setVocalGenders([]);
      setTempo(80);
      setMoods([]);
      setInstruments([]);
      setMainLanguage('한국어');
      setSubLanguage('');
      setSubLanguageRatio(30);
      setModel('V5');
      setExcludedElements([]);
      setAdditionalRequest('');
      setGenCount(1);
      setLyricsLengthWithSpaces(800);
      setLyricsLengthWithoutSpaces(400);
      setSuccess('설정이 초기화되었습니다.');
    }
  };

  const handleResetAllSettings = () => {
    if (window.confirm('모든 API 설정 및 테마를 초기화하시겠습니까?')) {
      setApiKey('');
      setBaseUrl('https://api.sunoapi.org/api/v1');
      setPromptModel('chatgpt');
      setGeminiApiKey('');
      setChatgptApiKey('');
      setTheme('dark');
      localStorage.clear();
      setSuccess('모든 설정이 초기화되었습니다. 페이지를 새로고침해주세요.');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

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
        
        setSuccess('설정이 성공적으로 적용되었습니다.');
      } catch (err) {
        setError('잘못된 설정 파일입니다.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>(() => {
    try {
      const saved = localStorage.getItem('generated_prompts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing prompts from localStorage:', e);
      return [];
    }
  });
  const [generatedHistory, setGeneratedHistory] = useState<{title: string, lyrics: string}[]>(() => {
    try {
      const saved = localStorage.getItem('generated_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('generated_history', JSON.stringify(generatedHistory.slice(-100))); // Keep last 100
  }, [generatedHistory]);

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
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());

  // Audio Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // API Settings Modal State
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [promptModel, setPromptModel] = useState<'chatgpt' | 'gemini'>(() => localStorage.getItem('prompt_model') as 'chatgpt' | 'gemini' || 'gemini');
  const [geminiApiKey, setGeminiApiKey] = useState(() => sanitizeKey(localStorage.getItem('gemini_api_key')));
  const [chatgptApiKey, setChatgptApiKey] = useState(() => sanitizeKey(localStorage.getItem('chatgpt_api_key')));



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
        console.log('WAV Generate Response:', response.data);
        
        let newTaskId = response.data?.data?.taskId || response.data?.taskId || response.data?.task_id;
        if (!newTaskId && Array.isArray(response.data) && response.data.length > 0) {
          newTaskId = response.data[0].taskId || response.data[0].task_id || response.data[0].id;
        }

        const directWavUrl = response.data?.data?.wavUrl || response.data?.wavUrl || response.data?.audioUrl;

        if (newTaskId && newTaskId !== song.taskId && newTaskId !== song.id) {
          setSuccess('WAV 변환 요청이 시작되었습니다. 완료 시 다운로드 버튼이 활성화됩니다.');
          setWavPollingTasks(prev => ({ ...prev, [song.id]: newTaskId }));
        } else if (directWavUrl && directWavUrl.endsWith('.wav')) {
          setSuccess('WAV 변환이 완료되었습니다.');
          setSongs(prev => prev.map(s => s.id === song.id ? { ...s, wav_url: directWavUrl } : s));
          setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
          downloadWavFile(directWavUrl, song.title);
        } else {
          // 새로운 taskId가 없는 경우, 이미 변환되었거나 API 응답 형식이 다를 수 있습니다.
          // 이 경우 기존 audioUrl이 wav인지 확인하거나 에러 처리합니다.
          if (song.audio_url?.endsWith('.wav') || song.wav_url) {
            setSuccess('이미 WAV 형식이거나 변환이 완료되었습니다.');
            downloadWavFile(song.wav_url || song.audio_url!, song.title);
          } else {
            setError('WAV 변환 작업 ID를 받지 못했습니다. 잠시 후 다시 시도해주세요.');
          }
          setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
        }
      } else {
        setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'WAV 변환 요청에 실패했습니다.');
      setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
    }
  };

  const handleDownload = async (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    if (!song.audio_url) return;
    
    const safeTitle = (song.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}.mp3`;
    const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(song.audio_url)}`;

    try {
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(`'${fileName}' 다운로드가 시작되었습니다.`);
    } catch (err) {
      console.error('Download failed:', err);
      setError('파일 다운로드에 실패했습니다.');
    }
  };

  const handleBatchDownload = async () => {
    if (selectedSongs.size === 0) return;
    
    const songsToDownload = songs.filter(s => selectedSongs.has(s.id) && s.status === 'complete');
    if (songsToDownload.length === 0) {
      setError('선택된 곡 중 다운로드 가능한(완료된) 곡이 없습니다.');
      return;
    }

    setIsRequesting(true);
    setSuccess(`${songsToDownload.length}개의 파일 압축을 시작합니다...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder("suno_songs");

      for (const song of songsToDownload) {
        if (!song.audio_url) continue;
        const safeTitle = (song.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `${safeTitle}.mp3`;
        const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(song.audio_url)}`;
        
        try {
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
          const blob = await response.blob();
          folder?.file(fileName, blob);
        } catch (err) {
          console.error(`Error downloading ${fileName}:`, err);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      
      const now = new Date();
      const dateStr = now.getFullYear() + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + 
                      String(now.getMinutes()).padStart(2, '0') + 
                      String(now.getSeconds()).padStart(2, '0');
      const zipFileName = `suno_${dateStr}_${timeStr}.zip`;
      
      saveAs(content, zipFileName);
      setSuccess('압축 파일 다운로드가 완료되었습니다.');
      setSelectedSongs(new Set()); // Clear selection after download
    } catch (err: any) {
      setError('대량 다운로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const toggleSongSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAllSongs = () => {
    const filteredSongs = (songs || []).filter(s => {
      if (!s) return false;
      const title = s.title || '';
      const tags = s.tags || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tags.toLowerCase().includes(searchQuery.toLowerCase());
      if (filter === 'complete') return matchesSearch && s.status === 'complete';
      if (filter === 'favorite') return matchesSearch && s.isFavorite;
      return matchesSearch;
    });

    const allIds = filteredSongs.map(s => s.id);
    setSelectedSongs(prev => {
      if (prev.size === allIds.length && allIds.every(id => prev.has(id))) {
        return new Set();
      }
      return new Set(allIds);
    });
  };

  const selectSongsByRange = (range: 'hour' | 'today' | '24h' | '7d') => {
    const now = new Date();
    let startTime = new Date();

    if (range === 'hour') startTime.setHours(now.getHours() - 1);
    else if (range === 'today') startTime.setHours(0, 0, 0, 0);
    else if (range === '24h') startTime.setHours(now.getHours() - 24);
    else if (range === '7d') startTime.setDate(now.getDate() - 7);

    const filteredIds = songs
      .filter(s => new Date(s.created_at) >= startTime)
      .map(s => s.id);

    setSelectedSongs(new Set(filteredIds));
    setSuccess(`${filteredIds.length}개의 곡이 선택되었습니다.`);
  };

  const selectGroupSongs = (songIds: string[]) => {
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      const allInGroupSelected = songIds.every(id => newSet.has(id));
      
      if (allInGroupSelected) {
        songIds.forEach(id => newSet.delete(id));
      } else {
        songIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const downloadWavFile = async (wavUrl: string, title: string) => {
    const safeTitle = (title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}.wav`;
    const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(wavUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess(`'${fileName}' 다운로드가 시작되었습니다.`);
    } catch (err) {
      console.error('WAV download failed:', err);
      setError('WAV 파일 다운로드에 실패했습니다.');
    }
  };

  const handleDownloadWav = async (song: Song, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!song.wav_url) return;
    await downloadWavFile(song.wav_url, song.title);
  };

  // Save settings
  useEffect(() => {
    localStorage.setItem('suno_api_key', apiKey);
    localStorage.setItem('suno_base_url', baseUrl);
    localStorage.setItem('prompt_model', promptModel);
    localStorage.setItem('gemini_api_key', geminiApiKey);
    localStorage.setItem('chatgpt_api_key', chatgptApiKey);
  }, [apiKey, baseUrl, promptModel, geminiApiKey, chatgptApiKey]);

  useEffect(() => {
    try {
      localStorage.setItem('generated_prompts', JSON.stringify(prompts));
    } catch (e) {
      console.error('Error saving prompts to localStorage:', e);
    }
  }, [prompts]);

  useEffect(() => {
    try {
      localStorage.setItem('generated_songs', JSON.stringify(songs));
    } catch (e) {
      console.error('Error saving songs to localStorage:', e);
    }
  }, [songs]);

  useEffect(() => {
    if (currentSong) {
      const updatedSong = songs.find(s => s.id === currentSong.id);
      if (updatedSong && (updatedSong.status !== currentSong.status || updatedSong.audio_url !== currentSong.audio_url)) {
        setCurrentSong(updatedSong);
      }
    }
  }, [songs, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      if (isPlaying && currentSong?.audio_url) {
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Playback aborted');
          } else if (err.name === 'NotAllowedError') {
            setIsPlaying(false);
          }
        }
      } else {
        audio.pause();
      }
    };

    handlePlay();
  }, [isPlaying, currentSong?.audio_url]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

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

  useEffect(() => {
    if (!isRequesting && taskIds.length === 0 && isGenerating) {
      setIsGenerating(false);
    }
  }, [isRequesting, taskIds, isGenerating]);

  // Polling logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (taskIds.length > 0 && isGenerating) {
      intervalId = setInterval(async () => {
        // Use a copy to avoid issues with concurrent updates
        const currentTaskIds = [...taskIds];
        
        for (const currentTaskId of currentTaskIds) {
          try {
            const response = await axios.get(`/api/suno/status/${currentTaskId}?baseUrl=${encodeURIComponent(baseUrl)}`, {
              headers: { Authorization: `Bearer ${apiKey}` }
            });
            
            let data = response.data;
            console.log(`Status check for ${currentTaskId}:`, data);

            // Handle common wrapper formats
            if (data && data.code === 200 && data.data) {
              data = data.data;
            }
            
            if (data) {
              // Handle case where data is an array of songs directly
              let sunoData: any[] = [];
              let status = '';
              let errorMessage = '';

              if (Array.isArray(data)) {
                sunoData = data;
                // If it's an array, we assume it's successful if we have data
                const allHaveAudio = sunoData.every(s => s.audioUrl || s.audio_url || s.url || s.play_url || s.cdn_url);
                status = allHaveAudio ? 'SUCCESS' : 'PROCESSING';
              } else {
                status = data.status || data.state || '';
                errorMessage = data.errorMessage || data.error || data.msg || '';
                sunoData = data.response?.sunoData || data.data || (Array.isArray(data.songs) ? data.songs : []);
                
                // If sunoData is still empty, maybe the object itself is the song
                if (sunoData.length === 0 && (data.id || data.audio_url || data.audioUrl || data.url)) {
                  sunoData = [data];
                }
              }
              
              const isError = status === 'FAILED' || status === 'ERROR' || status === 'error' || errorMessage;
              
              // Only consider it a final success if we actually have audio URLs for all songs in the task
              const hasAudioUrls = sunoData.length > 0 && sunoData.every(s => s.audioUrl || s.audio_url || s.url || s.play_url || s.cdn_url || s.stream_url);
              
              const isSuccess = (status === 'SUCCESS' || status === 'complete' || status === 'COMPLETED' || status === 'FINISHED' || 
                               status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS' || status === 'done') && hasAudioUrls;

              if (isSuccess || isError || status === 'PROCESSING' || status === 'streaming' || status === 'QUEUED' || status === 'SUCCESS' || status === 'complete' || status === 'pending') {
                if (sunoData.length > 0) {
                  setSongs(prev => {
                    const updated = [...prev];
                    sunoData.forEach((newSong: any, index: number) => {
                      const audioUrl = newSong.audioUrl || newSong.audio_url || newSong.url || newSong.play_url || newSong.cdn_url || newSong.stream_url || '';
                      if (audioUrl) console.log(`Found audio URL for ${newSong.id || currentTaskId}: ${audioUrl}`);
                      
                      let songTitle = newSong.title || 'Untitled';
                      if (index === 1 && !songTitle.toLowerCase().includes('v2')) {
                        songTitle += ' v2';
                      }

                      const mappedSong: Song = {
                        id: newSong.id || newSong.song_id || newSong.audio_id || (sunoData.length > 1 ? `${currentTaskId}_${index}` : currentTaskId),
                        title: songTitle,
                        image_url: newSong.imageUrl || newSong.image_url || newSong.image || newSong.metadata?.image_url || '',
                        lyric: newSong.prompt || newSong.lyric || newSong.lyrics || newSong.metadata?.prompt || '',
                        audio_url: audioUrl,
                        video_url: newSong.videoUrl || newSong.video_url || newSong.video || '',
                        created_at: newSong.createTime || newSong.created_at || new Date().toISOString(),
                        model_name: newSong.modelName || newSong.model || '',
                        status: isError ? 'error' : (isSuccess && audioUrl) ? 'complete' : 'streaming',
                        tags: newSong.tags || newSong.style || newSong.metadata?.tags || '',
                        duration: newSong.duration?.toString() || '',
                        taskId: currentTaskId
                      };
                      const idx = updated.findIndex(s => s.id === mappedSong.id);
                      if (idx !== -1) updated[idx] = mappedSong;
                      else updated.unshift(mappedSong);
                    });
                    return updated;
                  });
                }
                
                if ((isSuccess || isError) && status !== 'streaming') {
                  setTaskIds(prev => {
                    const newIds = prev.filter(id => id !== currentTaskId);
                    if (newIds.length === 0 && !isRequesting) setIsGenerating(false);
                    return newIds;
                  });
                }
              } else if (status === 'FAILED' || status === 'ERROR' || status.includes('FAILED') || status.includes('ERROR')) {
                setError(prev => prev ? `${prev}\n오류: ${errorMessage || status}` : `오류: ${errorMessage || status}`);
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
  }, [taskIds, isGenerating, apiKey, baseUrl, isRequesting]);

  // WAV Polling logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const taskIds = Object.keys(wavPollingTasks);
    
    if (taskIds.length > 0) {
      intervalId = setInterval(async () => {
        for (const songId of taskIds) {
          const tId = wavPollingTasks[songId];
          try {
            const response = await axios.get(`/api/suno/wav/record-info?taskId=${tId}&baseUrl=${encodeURIComponent(baseUrl)}`, {
              headers: { Authorization: `Bearer ${apiKey}` }
            });
            
            let data = response.data;
            if (data && data.code === 200) {
              data = data.data;
            }
            
            if (data) {
              // 신규 WAV record-info 구조 대응 (사용자 제공)
              const wavUrl = data.response?.audioWavUrl || data.response?.wavUrl;
              const status = data.successFlag || data.status;
              
              if (wavUrl && status === 'SUCCESS') {
                setSongs(prev => prev.map(s => s.id === songId ? { ...s, wav_url: wavUrl } : s));
                setWavPollingTasks(prev => {
                  const newTasks = { ...prev };
                  delete newTasks[songId];
                  return newTasks;
                });
                setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
                
                // 자동으로 다운로드 실행
                const song = songs.find(s => s.id === songId);
                const title = song?.title || 'Untitled';
                downloadWavFile(wavUrl, title);
              } else if (status === 'FAILED' || status === 'CREATE_TASK_FAILED' || status === 'GENERATE_AUDIO_FAILED') {
                setWavPollingTasks(prev => {
                  const newTasks = { ...prev };
                  delete newTasks[songId];
                  return newTasks;
                });
                setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
                alert(`WAV 변환 실패: ${data.errorMessage || '오디오 URL을 찾을 수 없습니다.'}`);
              } else {
                // 기존 구조(sunoData)에 대한 하위 호환성 유지
                const sunoData = data.response?.sunoData || [];
                const songData = sunoData.find((s: any) => s.id === songId) || sunoData[0];
                
                if (songData) {
                  const legacyWavUrl = songData.wavUrl || (songData.audioUrl?.endsWith('.wav') ? songData.audioUrl : null);
                  
                  if (legacyWavUrl || (status === 'SUCCESS' && songData.audioUrl)) {
                    const finalWavUrl = legacyWavUrl || songData.audioUrl;
                    
                    setSongs(prev => prev.map(s => s.id === songId ? { ...s, wav_url: finalWavUrl } : s));
                    setWavPollingTasks(prev => {
                      const newTasks = { ...prev };
                      delete newTasks[songId];
                      return newTasks;
                    });
                    setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
                    
                    const title = songData.title || 'Untitled';
                    downloadWavFile(finalWavUrl, title);
                  }
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

  const extractJSON = (text: string) => {
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch (e) {
      // Try to extract from markdown code blocks
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        try {
          return JSON.parse(match[1]);
        } catch (e2) {
          // If still fails, try to find the first { and last }
          const firstBrace = match[1].indexOf('{');
          const lastBrace = match[1].lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            try {
              return JSON.parse(match[1].substring(firstBrace, lastBrace + 1));
            } catch (e3) {
              throw new Error('JSON parsing failed even after extraction attempts');
            }
          }
          throw e2;
        }
      }
      
      // Try to find the first { and last } even without code blocks
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch (e3) {
          throw new Error('JSON parsing failed');
        }
      }
      
      throw e;
    }
  };

  const recheckStatus = async (song: Song) => {
    if (!song.taskId) {
      setError('태스크 ID를 찾을 수 없어 상태를 확인할 수 없습니다.');
      return;
    }
    
    setTaskIds(prev => {
      if (!prev.includes(song.taskId!)) {
        return [...prev, song.taskId!];
      }
      return prev;
    });
    setSuccess('상태를 다시 확인하는 중입니다...');
  };

  const handleGeneratePrompt = async (shouldSwitchTab: boolean = true, currentBatchHistory: {title: string, lyrics: string}[] = []): Promise<GeneratedPrompt | null> => {
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

    try {
      const allTags = [
        ...(genres || []).map(t => t && t.label),
        ...(subGenres || []).map(t => t && t.label),
        musicType === 'instrumental' ? 'instrumental' : '',
        ...(vocalTypes || []).map(t => t && t.label),
        ...(vocalGenders || []).map(t => t && t.label),
        `${tempo}bpm`,
        ...(moods || []).map(t => t && t.label),
        ...(instruments || []).map(t => t && t.label),
        subLanguage ? `${mainLanguage} ${100 - subLanguageRatio}%, ${subLanguage} ${subLanguageRatio}%` : mainLanguage,
        ...(excludedElements || []).map(t => t && `no ${t.label}`)
      ].filter(Boolean).join(', ');

      const lengthDescription = `공백 포함 약 ${lyricsLengthWithSpaces}자, 공백 제외 약 ${lyricsLengthWithoutSpaces}자 내외의 분량 (지정된 장르에 최적화된 구조 적용)`;

      // Combine global history and current batch history
      const fullHistory = [...generatedHistory, ...currentBatchHistory].slice(-30); // Last 30 items for context
      const historyTitles = fullHistory.map(h => h.title).join(', ');

      const systemPrompt = `당신은 전문적인 음악 작사가이자 프로듀서입니다. 다음 설정을 바탕으로 음악의 제목, 가사, 그리고 Suno AI에 입력할 최적화된 '스타일 프롬프트(Style Prompt)'를 작성해주세요.

설명: ${description}
추가 요청사항: ${additionalRequest}
선택된 기본 태그: ${allTags}
요청된 가사 길이: ${lengthDescription}

[가사 작성 가이드]
- 지정된 장르의 가장 대중적이고 최적화된 곡 구조(Intro-Verse-Chorus-Bridge-Outro)를 자동으로 적용하여 약 3분 내외의 곡이 되도록 충분한 분량의 가사를 작성하세요.
- 반드시 각 단락 앞에 메타 태그(예: [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro], [Guitar Solo], [Drop] 등)를 포함하여 Suno AI가 곡의 흐름을 이해할 수 있게 하세요.
- 곡 중간의 모든 지시문(예: [Emotional], [Whispering], [Build-up], [Fast], [Slow] 등)과 악기 연주 지시도 반드시 대괄호 []를 사용하여 작성하세요.
- 장르의 특성(리듬, 라임, 감정선)을 살려 작사하되, **선택된 태그 정보(장르명, 악기명, 분위기 등)를 가사 텍스트 내에 직접적으로 언급하거나 포함하지 마세요.**
- **중요: 제목과 가사는 항상 독창적이고 새로워야 합니다. 이전에 생성된 것과 유사하지 않도록 매번 다른 주제나 표현을 사용하여 절대 겹치지 않게 작성하세요. 특히 제목은 항상 고유하고 창의적이어야 합니다.**
- **랜덤성 및 다양성: 동일한 설정이라도 매번 완전히 다른 관점, 감정, 상황을 설정하여 창의적이고 랜덤하게 생성하세요.**
- **제외할 제목 목록 (이미 생성됨): ${historyTitles || '없음'}**
- 기악곡(Instrumental)인 경우 가사 대신 "[Instrumental]" 이라고만 작성하세요.

[Suno AI 스타일 프롬프트 작성 가이드]
- 선택된 기본 태그와 설명을 바탕으로 Suno AI가 가장 잘 이해할 수 있는 음악 장르, 무드, 악기, 보컬 스타일 등을 쉼표로 구분하여 영문으로 작성하세요.
- **무조건 최고 음질로 생성되도록 다음 키워드를 프롬프트에 반드시 포함하세요: high quality, mastered, professional studio, crystal clear audio, high fidelity**
- 특히 선택된 주요 악기(${(instruments || []).map(t => t && t.label).join(', ')}) 소리가 곡 전체에서 잘 들리고 강조되도록 프롬프트에 포함하세요. (예: prominent piano, leading electric guitar, heavy bass 등)
- 최대 120자를 넘지 않도록 핵심 키워드 위주로 간결하게 작성하세요.

반드시 다음 JSON 형식으로 응답해주세요:
{
  "title": "음악 제목",
  "lyrics": "가사 내용 (메타 태그 포함, 장르에 최적화된 구조)",
  "style_prompt": "Suno AI용 영문 스타일 프롬프트"
}`;

      let title = '';
      let lyrics = '';
      let style_prompt = '';

      if (promptModel === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: systemPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                lyrics: { type: Type.STRING },
                style_prompt: { type: Type.STRING }
              },
              required: ["title", "lyrics", "style_prompt"]
            }
          }
        });
        
        let responseText = '';
        try {
          responseText = result.text || '';
        } catch (e) {
          console.error('Error getting response text:', e);
          if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            responseText = result.candidates[0].content.parts[0].text;
          }
        }

        const data = extractJSON(responseText || '{}');
        title = safeString(data.title, '제목 없음');
        lyrics = safeString(data.lyrics, '가사 없음');
        style_prompt = safeString(data.style_prompt, allTags);
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

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'ChatGPT API 요청에 실패했습니다.');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const parsed = extractJSON(content);
        title = safeString(parsed.title, '제목 없음');
        lyrics = safeString(parsed.lyrics, '가사 없음');
        style_prompt = safeString(parsed.style_prompt, allTags);
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
      setGeneratedHistory(prev => [...prev, { title, lyrics }].slice(-100));
      if (shouldSwitchTab) setLibraryTab('prompts');
      return newPrompt;
    } catch (err: any) {
      console.error('Prompt generation error:', err);
      setError('프롬프트 생성 중 오류가 발생했습니다: ' + (err?.message || String(err)));
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

    // Truncate description to prevent excessively large AI responses
    const truncatedDescription = description.length > 2000 
      ? description.substring(0, 2000) + '... (truncated)' 
      : description;

    const systemPrompt = `당신은 전문적인 음악 프로듀서입니다. 사용자가 입력한 음악 설명을 바탕으로 Suno AI 음악 생성을 위한 최적의 설정을 제안해주세요.
    
설명: ${truncatedDescription}

반드시 다음 JSON 형식으로 응답해주세요:
{
  "genres": ["장르1", "장르2"],
  "subGenres": ["세부장르1"],
  "moods": ["분위기1", "분위기2"],
  "instruments": ["악기1", "악기2"],
  "excludedElements": ["제외할요소1", "제외할요소2"],
  "vocalGenders": ["남성", "여성" 또는 "없음"],
  "vocalTypes": ["보컬스타일1"],
  "musicType": "vocal" 또는 "instrumental",
  "tempo": 80,
  "mainLanguage": "한국어",
  "lyricsLengthWithSpaces": 800,
  "lyricsLengthWithoutSpaces": 400
}

* 장르, 세부장르, 분위기, 악기, 제외할 요소, 보컬스타일은 한국어로 작성해주세요.
* **모든 태그(장르, 분위기, 악기, 보컬스타일 등)는 10자 이내의 간결한 단어 또는 구문으로 작성하세요.**
* **불필요한 설명이나 반복되는 문구(예: "소리리리리" 등)는 절대 포함하지 마세요.**
* excludedElements는 음악에서 피해야 할 스타일이나 요소(예: "시끄러운 드럼", "슬픈 분위기" 등)를 제안해주세요.
* vocalGenders는 "남성", "여성", "남녀 듀엣" 등으로 제안해주세요.
* tempo는 숫자로만 제안해주세요 (예: 120).
* musicType은 보컬이 있으면 "vocal", 연주곡이면 "instrumental"로 제안해주세요.
* lyricsLengthWithSpaces와 lyricsLengthWithoutSpaces는 숫자로 제안해주세요.`;

    try {
      let data;
      if (promptModel === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: systemPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                subGenres: { type: Type.ARRAY, items: { type: Type.STRING } },
                moods: { type: Type.ARRAY, items: { type: Type.STRING } },
                instruments: { type: Type.ARRAY, items: { type: Type.STRING } },
                excludedElements: { type: Type.ARRAY, items: { type: Type.STRING } },
                vocalGenders: { type: Type.ARRAY, items: { type: Type.STRING } },
                vocalTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
                musicType: { type: Type.STRING },
                tempo: { type: Type.NUMBER },
                mainLanguage: { type: Type.STRING },
                lyricsLengthWithSpaces: { type: Type.NUMBER },
                lyricsLengthWithoutSpaces: { type: Type.NUMBER }
              }
            }
          }
        });
        
        let responseText = '';
        try {
          responseText = result.text || '';
        } catch (e) {
          console.error('Error getting response text:', e);
          if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            responseText = result.candidates[0].content.parts[0].text;
          }
        }

        try {
          data = extractJSON(responseText || '{}');
        } catch (jsonErr) {
          console.error('JSON Extraction Error:', jsonErr, 'Response Text:', responseText);
          throw new Error('AI 응답을 해석하는 데 실패했습니다. 다시 시도해주세요.');
        }
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

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'ChatGPT API 요청에 실패했습니다.');
        }

        const resData = await response.json();
        const content = resData.choices?.[0]?.message?.content || '{}';
        try {
          data = extractJSON(content);
        } catch (jsonErr) {
          console.error('JSON Extraction Error (ChatGPT):', jsonErr, 'Content:', content);
          throw new Error('AI 응답을 해석하는 데 실패했습니다. 다시 시도해주세요.');
        }
      }

      if (data) {
        if (data.genres && Array.isArray(data.genres)) {
          setGenres(data.genres.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.subGenres && Array.isArray(data.subGenres)) {
          setSubGenres(data.subGenres.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.moods && Array.isArray(data.moods)) {
          setMoods(data.moods.map((m: any) => ({ id: Math.random().toString(), label: sanitizeTag(m) })));
        }
        if (data.instruments && Array.isArray(data.instruments)) {
          setInstruments(data.instruments.map((i: any) => ({ id: Math.random().toString(), label: sanitizeTag(i) })));
        }
        if (data.excludedElements && Array.isArray(data.excludedElements)) {
          setExcludedElements(data.excludedElements.map((e: any) => ({ id: Math.random().toString(), label: sanitizeTag(e) })));
        }
        if (data.vocalGenders && Array.isArray(data.vocalGenders)) {
          setVocalGenders(data.vocalGenders.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.vocalTypes && Array.isArray(data.vocalTypes)) {
          setVocalTypes(data.vocalTypes.map((v: any) => ({ id: Math.random().toString(), label: sanitizeTag(v) })));
        }
        if (data.musicType) setMusicType(String(data.musicType).toLowerCase() as any);
        if (data.tempo) setTempo(Number(data.tempo) || 80);
        if (data.mainLanguage) setMainLanguage(String(data.mainLanguage));
        if (data.lyricsLengthWithSpaces) setLyricsLengthWithSpaces(Number(data.lyricsLengthWithSpaces) || 800);
        if (data.lyricsLengthWithoutSpaces) setLyricsLengthWithoutSpaces(Number(data.lyricsLengthWithoutSpaces) || 400);
        
        setShowAdvanced(true);
        console.log('AI Auto Setup completed');
      }
    } catch (err: any) {
      console.error('Auto setup error:', err);
      setError('자동 설정 중 오류가 발생했습니다: ' + (err?.message || String(err)));
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
    const allIds = (prompts || []).map(p => p && p.id).filter(Boolean);
    setSelectedPrompts(prev => {
      if (prev.size === allIds.length && allIds.every(id => prev.has(id))) {
        return new Set();
      }
      return new Set(allIds);
    });
  };

  const selectTodayPrompts = () => {
    const today = new Date().toDateString();
    const todayIds = (prompts || [])
      .filter(p => p && new Date(p.created_at).toDateString() === today)
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
    const recentIds = (prompts || [])
      .filter(p => p && new Date(p.created_at).getTime() > oneHourAgo)
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
      if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('여성') || safeString(t.label).toLowerCase().includes('female')))) {
        gender = 'f';
      } else if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('남성') || safeString(t.label).toLowerCase().includes('male')))) {
        gender = 'm';
      }

      for (let i = 0; i < genCount; i++) {
        setGenerationProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Add request number to the title for clarity
        const requestTitle = promptToUse.title;

        const payload = {
          apiKey,
          baseUrl,
          customMode: true,
          make_instrumental: musicType === 'instrumental',
          model: model || "V4_5ALL",
          prompt: promptToUse.lyrics || "",
          tags: promptToUse.style_prompt || promptToUse.tags || "",
          title: requestTitle || "",
          negativeTags: (excludedElements || []).map(t => t && t.label).filter(Boolean).join(', ') || "",
          vocalGender: gender || "",
          styleWeight: 0.65,
          weirdnessConstraint: 0.65,
          audioWeight: 0.65,
          callBackUrl: "https://example.com/callback"
        };

        const response = await axios.post('/api/suno/generate', payload);
        
        console.log('Generate Response (From Prompt):', response.data);

        if (response.data?.code === 200 && response.data?.data?.taskId) {
          const taskId = String(response.data.data.taskId);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        } else if (response.data?.code && response.data.code !== 200) {
          const msg = response.data.message || response.data.error || '';
          const fullMsg = `API Error: ${response.data.code}${msg ? ` - ${msg}` : ''}`;
          setError(prev => prev ? `${prev}\n${fullMsg}` : fullMsg);
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          const slicedData = response.data.slice(0, 2).map((s: any, idx: number) => {
            if (idx === 1 && s.title && !s.title.toLowerCase().includes('v2')) {
              return { ...s, title: `${s.title} v2` };
            }
            return s;
          });
          setSongs(prev => [...slicedData, ...prev]);
          const ids = slicedData.map((s: any) => String(s.id)).filter((id: string) => id.trim());
          setTaskIds(prev => [...prev, ...ids]);
        } else if (response.data && response.data.task_id) {
          const taskId = String(response.data.task_id);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        } else if (response.data && response.data.taskId) {
          const taskId = String(response.data.taskId);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        }

        // Add a small delay between requests if genCount > 1
        if (genCount > 1 && i < genCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || '음악 생성 요청에 실패했습니다.');
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
      const currentBatchHistory: {title: string, lyrics: string}[] = [];
      for (let i = 0; i < genCount; i++) {
        const promptToUse = await handleGeneratePrompt(i === 0, currentBatchHistory); // Only switch tab on the first one
        if (promptToUse) {
          currentBatchHistory.push({ title: promptToUse.title, lyrics: promptToUse.lyrics });
        }
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
      if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('여성') || safeString(t.label).toLowerCase().includes('female')))) {
        gender = 'f';
      } else if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('남성') || safeString(t.label).toLowerCase().includes('male')))) {
        gender = 'm';
      }

      const currentBatchHistory: {title: string, lyrics: string}[] = [];

      for (let i = 0; i < genCount; i++) {
        setGenerationProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Generate a new unique prompt for each iteration
        const promptToUse = await handleGeneratePrompt(false, currentBatchHistory);
        if (!promptToUse) continue;
        
        currentBatchHistory.push({ title: promptToUse.title, lyrics: promptToUse.lyrics });
        
        // Add request number to the title for clarity
        const requestTitle = promptToUse.title;
        
        // Ensure we stay on the music tab
        setLibraryTab('music');

        const payload = {
          apiKey,
          baseUrl,
          customMode: true,
          make_instrumental: musicType === 'instrumental',
          model: model || "V4_5ALL",
          prompt: promptToUse.lyrics || "",
          tags: promptToUse.style_prompt || promptToUse.tags || "",
          title: requestTitle || "",
          negativeTags: (excludedElements || []).map(t => safeString(t && t.label)).filter(Boolean).join(', ') || "",
          vocalGender: gender || "",
          styleWeight: 0.65,
          weirdnessConstraint: 0.65,
          audioWeight: 0.65,
          callBackUrl: "https://example.com/callback"
        };

        const response = await axios.post('/api/suno/generate', payload);
        
        console.log('Generate Response (Direct):', response.data);

        if (response.data?.code === 200 && response.data?.data?.taskId) {
          const taskId = String(response.data.data.taskId);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        } else if (response.data?.code && response.data.code !== 200) {
          const msg = response.data.message || response.data.error || '';
          const fullMsg = `API Error: ${response.data.code}${msg ? ` - ${msg}` : ''}`;
          setError(prev => prev ? `${prev}\n${fullMsg}` : fullMsg);
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          const slicedData = response.data.slice(0, 2).map((s: any, idx: number) => {
            if (idx === 1 && s.title && !s.title.toLowerCase().includes('v2')) {
              return { ...s, title: `${s.title} v2` };
            }
            return s;
          });
          setSongs(prev => [...slicedData, ...prev]);
          const ids = slicedData.map((s: any) => String(s.id)).filter((id: string) => id.trim());
          setTaskIds(prev => [...prev, ...ids]);
        } else if (response.data && response.data.task_id) {
          const taskId = String(response.data.task_id);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        } else if (response.data && response.data.taskId) {
          const taskId = String(response.data.taskId);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        }

        // Add a small delay between requests if genCount > 1
        if (genCount > 1 && i < genCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err: any) {
      console.error('Music generation error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || String(err) || '음악 생성 요청에 실패했습니다.';
      setError(errorMsg);
      // Only stop generating if no tasks were successfully started
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
    } finally {
      setIsRequesting(false);
      // If we finished all loops and no task IDs were added, we should reset isGenerating
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
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
    setIsRequesting(true);
    setGenerationProgress({ current: 0, total: promptsToGenerate.length });
    setLibraryTab('music');
    
    let newTaskIds: string[] = [];
    let hasError = false;

    try {
      let currentIdx = 0;
      for (const promptToUse of promptsToGenerate) {
        currentIdx++;
        setGenerationProgress(prev => ({ ...prev, current: currentIdx }));
        try {
          let gender = '';
          if (vocalGenders.some(t => safeString(t.label).includes('여성') || safeString(t.label).toLowerCase().includes('female'))) {
            gender = 'f';
          } else if (vocalGenders.some(t => safeString(t.label).includes('남성') || safeString(t.label).toLowerCase().includes('male'))) {
            gender = 'm';
          }

          const payload = {
            apiKey,
            baseUrl,
            customMode: true,
            make_instrumental: musicType === 'instrumental',
            model: model || "V4_5ALL",
            prompt: promptToUse.lyrics || "",
            tags: promptToUse.style_prompt || promptToUse.tags || "",
            title: promptToUse.title || "",
            negativeTags: (excludedElements || []).map(t => safeString(t && t.label)).filter(Boolean).join(', ') || "",
            vocalGender: gender || "",
            styleWeight: 0.65,
            weirdnessConstraint: 0.65,
            audioWeight: 0.65,
            callBackUrl: "https://example.com/callback"
          };

          const response = await axios.post('/api/suno/generate', payload);
          
          if (response.data?.code === 200 && response.data?.data?.taskId) {
            const taskId = String(response.data.data.taskId);
            newTaskIds.push(taskId);
            setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
          } else if (response.data?.code && response.data.code !== 200) {
            const msg = response.data.message || response.data.error || '';
            const fullMsg = `API Error: ${response.data.code}${msg ? ` - ${msg}` : ''}`;
            setError(prev => prev ? `${prev}\n${fullMsg}` : fullMsg);
            hasError = true;
          } else if (Array.isArray(response.data) && response.data.length > 0) {
            const slicedData = response.data.slice(0, 2).map((s: any, idx: number) => {
              if (idx === 1 && s.title && !s.title.toLowerCase().includes('v2')) {
                return { ...s, title: `${s.title} v2` };
              }
              return s;
            });
            setSongs(prev => [...slicedData, ...prev]);
            const ids = slicedData.map((s: any) => String(s.id)).filter((id: string) => id.trim());
            newTaskIds.push(ids.join(','));
            setTaskIds(prev => [...prev, ...ids]);
          } else if (response.data && response.data.task_id) {
            const taskId = String(response.data.task_id);
            newTaskIds.push(taskId);
            setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
          } else if (response.data && response.data.taskId) {
            const taskId = String(response.data.taskId);
            newTaskIds.push(taskId);
            setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
          } else {
            setError(prev => prev ? `${prev}\n예상치 못한 응답 형식입니다.` : '예상치 못한 응답 형식입니다.');
            hasError = true;
          }
        } catch (err: any) {
          const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || '음악 생성 요청에 실패했습니다.';
          setError(prev => prev ? `${prev}\n${errMsg}` : errMsg);
          hasError = true;
        }
        
        // Add a small delay between requests to avoid rate limits
        if (currentIdx < promptsToGenerate.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setIsRequesting(false);
      if (newTaskIds.length === 0 && hasError) {
        setIsGenerating(false);
      }
      setSelectedPrompts(new Set());
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSongs(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleDelete = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    if (currentSong?.id === id) {
      setCurrentSong(null);
      setIsPlaying(false);
    }
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  const handleExtend = (song: Song) => {
    setSuccess('확장 기능은 아직 준비 중입니다.');
  };

  const removeTag = (setFn: React.Dispatch<React.SetStateAction<Tag[]>>, id: string) => {
    setFn(prev => (prev || []).filter(t => t && t.id !== id));
  };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-primary)]/30 flex flex-col`}>
      {/* Header */}
      <Header 
        onOpenSettings={() => setIsApiModalOpen(true)} 
        onOpenManual={() => setIsManualOpen(true)}
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
          handleGeneratePrompts={handleGeneratePrompts}
          handleGenerate={handleGenerate}
          isGeneratingPrompt={isGeneratingPrompt}
          isGenerating={isGenerating}
          error={error}
          success={success}
          removeTag={removeTag}
          onReset={handleResetForm}
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
                selectedSongs={selectedSongs}
                toggleSongSelection={toggleSongSelection}
                selectAllSongs={selectAllSongs}
                selectSongsByRange={selectSongsByRange}
                selectGroupSongs={selectGroupSongs}
                handleBatchDownload={handleBatchDownload}
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
          recheckStatus={recheckStatus}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
        />
      </div>

      {/* Global Audio Element */}
      <audio 
        ref={audioRef}
        src={currentSong?.audio_url ? `/api/proxy/audio?url=${encodeURIComponent(currentSong.audio_url)}` : null}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
        onError={(e) => {
          if (currentSong?.audio_url && e.currentTarget.src.includes('/api/proxy/audio')) {
            e.currentTarget.src = currentSong.audio_url;
          }
        }}
      />

      {/* Persistent Mini Player (Mobile & Desktop) */}
      <AnimatePresence>
        {currentSong && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] p-3 shadow-2xl lg:hidden"
          >
            <div className="flex items-center gap-4 max-w-screen-xl mx-auto">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)] shrink-0">
                {currentSong.image_url ? (
                  <img src={currentSong.image_url || null} alt={currentSong.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 opacity-20" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{currentSong.title || 'Untitled'}</h4>
                <p className="text-xs text-[var(--text-secondary)] truncate">{currentSong.tags}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 bg-[var(--text-primary)] rounded-full flex items-center justify-center text-[var(--bg-primary)]"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              </div>
            </div>
            <div className="absolute top-0 left-0 h-0.5 bg-[var(--accent-primary)] transition-all duration-300" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Settings Modal */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            key="generation-overlay"
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
            key="scroll-top-button"
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
        setBaseUrl={setBaseUrl}
        generatedHistoryCount={generatedHistory.length}
        onClearHistory={() => setGeneratedHistory([])}
        onResetAll={handleResetAllSettings}
      />

      <ManualModal 
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
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
