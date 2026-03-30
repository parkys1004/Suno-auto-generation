import { useState, useEffect } from 'react';
import { Tag } from '../types';
import { sanitizeKey } from '../utils/helpers';

export const useSettings = (requestConfirm: (title: string, message: string, onConfirm: () => void) => void, setSuccess: React.Dispatch<React.SetStateAction<string>>, setError: React.Dispatch<React.SetStateAction<string>>) => {
  const [apiKey, setApiKey] = useState(() => sanitizeKey(localStorage.getItem('suno_api_key')));
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('suno_base_url') || 'https://api.sunoapi.org/api/v1');
  const [promptModel, setPromptModel] = useState<'chatgpt' | 'gemini'>(() => localStorage.getItem('prompt_model') as 'chatgpt' | 'gemini' || 'gemini');
  const [geminiApiKey, setGeminiApiKey] = useState(() => sanitizeKey(localStorage.getItem('gemini_api_key')));
  const [chatgptApiKey, setChatgptApiKey] = useState(() => sanitizeKey(localStorage.getItem('chatgpt_api_key')));
  
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
  const [model, setModel] = useState('V5_5');
  const [excludedElements, setExcludedElements] = useState<Tag[]>([]);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [genCount, setGenCount] = useState(1);
  const [lyricsLengthWithSpaces, setLyricsLengthWithSpaces] = useState(800);
  const [lyricsLengthWithoutSpaces, setLyricsLengthWithoutSpaces] = useState(400);

  useEffect(() => {
    localStorage.setItem('suno_api_key', apiKey);
    localStorage.setItem('suno_base_url', baseUrl);
    localStorage.setItem('prompt_model', promptModel);
    localStorage.setItem('gemini_api_key', geminiApiKey);
    localStorage.setItem('chatgpt_api_key', chatgptApiKey);
  }, [apiKey, baseUrl, promptModel, geminiApiKey, chatgptApiKey]);

  const handleResetForm = () => {
    requestConfirm('설정 초기화', '모든 생성 설정을 초기화하시겠습니까?', () => {
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
      setModel('V5_5');
      setExcludedElements([]);
      setAdditionalRequest('');
      setGenCount(1);
      setLyricsLengthWithSpaces(800);
      setLyricsLengthWithoutSpaces(400);
      setSuccess('설정이 초기화되었습니다.');
    });
  };

  const handleResetAllSettings = () => {
    requestConfirm('전체 설정 초기화', '모든 API 설정 및 테마를 초기화하시겠습니까?', () => {
      setApiKey('');
      setBaseUrl('https://api.sunoapi.org/api/v1');
      setPromptModel('chatgpt');
      setGeminiApiKey('');
      setChatgptApiKey('');
      setTheme('dark');
      localStorage.clear();
      setSuccess('모든 설정이 초기화되었습니다. 페이지를 새로고침해주세요.');
      setTimeout(() => window.location.reload(), 1500);
    });
  };

  const handleDownloadSettings = () => {
    const settings = {
      description, genres, subGenres, musicType, vocalTypes, vocalGenders,
      tempo, moods, instruments, mainLanguage, subLanguage, subLanguageRatio,
      model, excludedElements, additionalRequest, genCount,
      lyricsLengthWithSpaces, lyricsLengthWithoutSpaces
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
    event.target.value = '';
  };

  return {
    apiKey, setApiKey,
    baseUrl, setBaseUrl,
    promptModel, setPromptModel,
    geminiApiKey, setGeminiApiKey,
    chatgptApiKey, setChatgptApiKey,
    theme, toggleTheme,
    description, setDescription,
    showAdvanced, setShowAdvanced,
    genres, setGenres,
    subGenres, setSubGenres,
    musicType, setMusicType,
    vocalTypes, setVocalTypes,
    vocalGenders, setVocalGenders,
    tempo, setTempo,
    moods, setMoods,
    instruments, setInstruments,
    mainLanguage, setMainLanguage,
    subLanguage, setSubLanguage,
    subLanguageRatio, setSubLanguageRatio,
    model, setModel,
    excludedElements, setExcludedElements,
    additionalRequest, setAdditionalRequest,
    genCount, setGenCount,
    lyricsLengthWithSpaces, setLyricsLengthWithSpaces,
    lyricsLengthWithoutSpaces, setLyricsLengthWithoutSpaces,
    handleResetForm,
    handleResetAllSettings,
    handleDownloadSettings,
    handleUploadSettings
  };
};
