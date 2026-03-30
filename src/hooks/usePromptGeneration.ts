import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPrompt, Tag } from '../types';
import { extractJSON, sanitizeTag } from '../utils/helpers';

export interface PromptGenerationProps {
  description: string;
  geminiApiKey: string;
  chatgptApiKey: string;
  promptModel: 'chatgpt' | 'gemini';
  setGenres: (genres: Tag[]) => void;
  setSubGenres: (subGenres: Tag[]) => void;
  setMoods: (moods: Tag[]) => void;
  setInstruments: (instruments: Tag[]) => void;
  setExcludedElements: (excludedElements: Tag[]) => void;
  setVocalGenders: (vocalGenders: Tag[]) => void;
  setVocalTypes: (vocalTypes: Tag[]) => void;
  setMusicType: (musicType: 'vocal' | 'instrumental') => void;
  setTempo: (tempo: number) => void;
  setMainLanguage: (mainLanguage: string) => void;
  setSubLanguage: (subLanguage: string) => void;
  setSubLanguageRatio: (ratio: number) => void;
  setLyricsLengthWithSpaces: (len: number) => void;
  setLyricsLengthWithoutSpaces: (len: number) => void;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setSuccess: React.Dispatch<React.SetStateAction<string>>;
  genres: Tag[];
  subGenres: Tag[];
  moods: Tag[];
  instruments: Tag[];
  excludedElements: Tag[];
  vocalGenders: Tag[];
  vocalTypes: Tag[];
  musicType: 'vocal' | 'instrumental';
  tempo: number;
  mainLanguage: string;
  subLanguage: string;
  subLanguageRatio: number;
  additionalRequest: string;
  lyricsLengthWithSpaces: number;
  lyricsLengthWithoutSpaces: number;
}

export const usePromptGeneration = ({
  description,
  geminiApiKey,
  chatgptApiKey,
  promptModel,
  setGenres,
  setSubGenres,
  setMoods,
  setInstruments,
  setExcludedElements,
  setVocalGenders,
  setVocalTypes,
  setMusicType,
  setTempo,
  setMainLanguage,
  setSubLanguage,
  setSubLanguageRatio,
  setLyricsLengthWithSpaces,
  setLyricsLengthWithoutSpaces,
  setError,
  setSuccess,
  genres,
  subGenres,
  moods,
  instruments,
  excludedElements,
  vocalGenders,
  vocalTypes,
  musicType,
  tempo,
  mainLanguage,
  subLanguage,
  subLanguageRatio,
  additionalRequest,
  lyricsLengthWithSpaces,
  lyricsLengthWithoutSpaces
}: PromptGenerationProps) => {
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

  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isAutoSetting, setIsAutoSetting] = useState(false);

  useEffect(() => {
    localStorage.setItem('generated_history', JSON.stringify(generatedHistory.slice(-100)));
  }, [generatedHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('generated_prompts', JSON.stringify(prompts));
    } catch (e) {
      console.error('Error saving prompts to localStorage:', e);
    }
  }, [prompts]);

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

    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.')), 60000);
    });

    const historyToUse = [...generatedHistory, ...currentBatchHistory].slice(-10);
    const historyText = historyToUse.length > 0 
      ? `\n\n최근 생성 이력 (중복 피하기):\n${historyToUse.map(h => `- 제목: ${h.title}`).join('\n')}`
      : '';

    const settingsText = `
[적용할 설정]
- 주 언어: ${mainLanguage}
${subLanguage ? `- 보조 언어: ${subLanguage} (비율: ${subLanguageRatio}%)` : ''}
- 장르: ${genres.map(g => g.label).join(', ') || '지정 안 함'}
- 세부 장르: ${subGenres.map(g => g.label).join(', ') || '지정 안 함'}
- 분위기: ${moods.map(g => g.label).join(', ') || '지정 안 함'}
- 악기: ${instruments.map(g => g.label).join(', ') || '지정 안 함'}
- 제외할 요소: ${excludedElements.map(g => g.label).join(', ') || '지정 안 함'}
- 보컬 성별: ${vocalGenders.map(g => g.label).join(', ') || '지정 안 함'}
- 보컬 스타일: ${vocalTypes.map(g => g.label).join(', ') || '지정 안 함'}
- 음악 종류: ${musicType === 'vocal' ? '보컬곡' : '연주곡(Instrumental)'}
- 템포(BPM): ${tempo}
- 가사 길이(공백 포함): 약 ${lyricsLengthWithSpaces}자
- 가사 길이(공백 제외): 약 ${lyricsLengthWithoutSpaces}자
${additionalRequest ? `- 추가 요청사항: ${additionalRequest}` : ''}
`;

    const systemPrompt = `당신은 전문적인 작사가이자 음악 프로듀서입니다. 사용자의 요청과 설정을 바탕으로 Suno AI 음악 생성을 위한 최적의 프롬프트를 작성해주세요.
    
설명: ${description}${historyText}
${settingsText}

반드시 다음 JSON 형식으로 응답해주세요:
{
  "title": "곡 제목 (${mainLanguage})",
  "lyrics": "가사 (${mainLanguage}${subLanguage ? ` 및 ${subLanguage}` : ''}, [Verse], [Chorus], [Bridge] 등 구조 포함)",
  "style_prompt": "음악 스타일 태그 (영어, 쉼표로 구분, 예: k-pop, upbeat, female vocal, synth-pop)"
}

* 가사는 감성적이고 완성도 있게 작성해주세요.
* 가사의 언어는 반드시 [적용할 설정]의 '주 언어(${mainLanguage})'에 맞게 작성해주세요.
${subLanguage ? `* 가사에 보조 언어(${subLanguage})를 약 ${subLanguageRatio}% 비율로 자연스럽게 섞어서 작성해주세요.` : ''}
* 가사의 길이는 [적용할 설정]의 가사 길이를 최대한 반영해주세요.
* style_prompt는 Suno AI가 잘 이해할 수 있는 핵심 키워드 위주로 작성하되, [적용할 설정]의 장르, 분위기, 악기, 보컬 설정 등을 영어로 번역하여 포함해주세요.
* 제외할 요소가 있다면 style_prompt에 반영하지 않도록 주의해주세요.
* 음악 종류가 연주곡(Instrumental)인 경우 가사(lyrics)는 비워두거나 "[Instrumental]"로만 작성해주세요.
${additionalRequest ? `* **추가 요청사항을 반드시 반영해주세요:** ${additionalRequest}` : ''}
* **이전 생성 이력과 중복되지 않는 새로운 제목과 내용을 제안해주세요.**`;

    try {
      let data;
      if (promptModel === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const result = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: systemPrompt,
            config: {
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
          }),
          timeoutPromise
        ]) as any;
        
        clearTimeout(timeoutId!);
        
        let responseText = '';
        try {
          responseText = result.text || '';
        } catch (e) {
          console.error('Error getting response text:', e);
          if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            responseText = result.candidates[0].content.parts[0].text;
          }
        }
        data = extractJSON(responseText || '{}');
      } else {
        const response = await Promise.race([
          fetch('https://api.openai.com/v1/chat/completions', {
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
          }),
          timeoutPromise
        ]) as Response;
        
        clearTimeout(timeoutId!);
        
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const resData = await response.json();
        data = extractJSON(resData.choices?.[0]?.message?.content || '{}');
      }

      if (data && data.title && data.lyrics) {
        const newPrompt: GeneratedPrompt = {
          id: Math.random().toString(36).substring(2, 15),
          title: data.title,
          lyrics: data.lyrics,
          tags: data.style_prompt || '',
          style_prompt: data.style_prompt || '',
          created_at: new Date().toISOString()
        };
        setPrompts(prev => [newPrompt, ...prev]);
        setGeneratedHistory(prev => [...prev, { title: data.title, lyrics: data.lyrics }]);
        setSuccess('새로운 프롬프트가 생성되었습니다.');
        return newPrompt;
      }
      return null;
    } catch (err: any) {
      console.error('Prompt generation error:', err);
      setError(err.message || '프롬프트 생성에 실패했습니다.');
      return null;
    } finally {
      clearTimeout(timeoutId!);
      setIsGeneratingPrompt(false);
    }
  };

  const handleAutoSetup = async () => {
    if (!description) {
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
  "subLanguage": "영어",
  "subLanguageRatio": 30,
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
* mainLanguage는 주로 사용할 언어를 제안해주세요 (예: 한국어, 영어, 일본어 등).
* subLanguage는 보조로 섞어 쓸 언어가 있다면 제안하고, 없다면 빈 문자열("")로 제안해주세요.
* subLanguageRatio는 보조 언어가 있을 경우 그 비율을 숫자로 제안해주세요 (예: 30).
* lyricsLengthWithSpaces와 lyricsLengthWithoutSpaces는 숫자로 제안해주세요.`;

    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.')), 60000);
    });

    try {
      let data;
      if (promptModel === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const result = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: systemPrompt,
            config: {
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
                  subLanguage: { type: Type.STRING },
                  subLanguageRatio: { type: Type.NUMBER },
                  lyricsLengthWithSpaces: { type: Type.NUMBER },
                  lyricsLengthWithoutSpaces: { type: Type.NUMBER }
                }
              }
            }
          }),
          timeoutPromise
        ]) as any;
        
        clearTimeout(timeoutId!);
        
        let responseText = '';
        try {
          responseText = result.text || '';
        } catch (e) {
          console.error('Error getting response text:', e);
          if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            responseText = result.candidates[0].content.parts[0].text;
          }
        }
        data = extractJSON(responseText || '{}');
      } else {
        const response = await Promise.race([
          fetch('https://api.openai.com/v1/chat/completions', {
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
          }),
          timeoutPromise
        ]) as Response;
        
        clearTimeout(timeoutId!);
        
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const resData = await response.json();
        data = extractJSON(resData.choices?.[0]?.message?.content || '{}');
      }

      if (data) {
        if (data.genres && Array.isArray(data.genres)) {
          setGenres(data.genres.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.subGenres && Array.isArray(data.subGenres)) {
          setSubGenres(data.subGenres.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.moods && Array.isArray(data.moods)) {
          setMoods(data.moods.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.instruments && Array.isArray(data.instruments)) {
          setInstruments(data.instruments.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.excludedElements && Array.isArray(data.excludedElements)) {
          setExcludedElements(data.excludedElements.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.vocalGenders && Array.isArray(data.vocalGenders)) {
          setVocalGenders(data.vocalGenders.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.vocalTypes && Array.isArray(data.vocalTypes)) {
          setVocalTypes(data.vocalTypes.map((g: any) => ({ id: Math.random().toString(), label: sanitizeTag(g) })));
        }
        if (data.musicType) setMusicType(data.musicType as 'vocal' | 'instrumental');
        if (data.tempo) setTempo(data.tempo);
        if (data.mainLanguage) setMainLanguage(data.mainLanguage);
        if (data.subLanguage !== undefined) setSubLanguage(data.subLanguage);
        if (data.subLanguageRatio !== undefined) setSubLanguageRatio(data.subLanguageRatio);
        if (data.lyricsLengthWithSpaces) setLyricsLengthWithSpaces(data.lyricsLengthWithSpaces);
        if (data.lyricsLengthWithoutSpaces) setLyricsLengthWithoutSpaces(data.lyricsLengthWithoutSpaces);
        
        setSuccess('AI가 음악 설정을 자동으로 완료했습니다.');
      }
    } catch (err: any) {
      console.error('Auto setup error:', err);
      setError(err.message || '자동 설정에 실패했습니다.');
    } finally {
      clearTimeout(timeoutId!);
      setIsAutoSetting(false);
    }
  };

  const handleSavePrompt = (id: string, editPromptData: { title: string, style_prompt: string, lyrics: string }) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, ...editPromptData } : p));
    setSuccess('프롬프트가 수정되었습니다.');
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    setSuccess('프롬프트가 삭제되었습니다.');
  };

  const togglePromptSelection = (id: string, selectedPrompts: Set<string>, setSelectedPrompts: (s: Set<string>) => void) => {
    const newSelected = new Set(selectedPrompts);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedPrompts(newSelected);
  };

  const selectAllPrompts = (setSelectedPrompts: (s: Set<string>) => void) => {
    if (prompts.length === 0) return;
    setSelectedPrompts(new Set(prompts.map(p => p.id)));
  };

  const selectTodayPrompts = (setSelectedPrompts: (s: Set<string>) => void) => {
    const today = new Date().toISOString().slice(0, 10);
    const todayPrompts = prompts.filter(p => p.created_at.slice(0, 10) === today);
    if (todayPrompts.length === 0) return;
    setSelectedPrompts(new Set(todayPrompts.map(p => p.id)));
  };

  const handleGeneratePrompts = async (genCount: number, setLibraryTab: (tab: 'music' | 'prompts') => void) => {
    setIsGeneratingPrompt(true);
    setLibraryTab('prompts');
    
    try {
      const currentBatchHistory: {title: string, lyrics: string}[] = [];
      for (let i = 0; i < genCount; i++) {
        const promptToUse = await handleGeneratePrompt(i === 0, currentBatchHistory);
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

  return {
    prompts,
    setPrompts,
    generatedHistory,
    setGeneratedHistory,
    isGeneratingPrompt,
    isAutoSetting,
    handleGeneratePrompt,
    handleAutoSetup,
    handleSavePrompt,
    handleDeletePrompt,
    togglePromptSelection,
    selectAllPrompts,
    selectTodayPrompts,
    handleGeneratePrompts
  };
};
