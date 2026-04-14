import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Song, GeneratedPrompt, Tag } from '../types';
import { safeString } from '../utils/helpers';

export const useSunoApi = (
  apiKey: string,
  baseUrl: string,
  genCount: number,
  musicType: 'vocal' | 'instrumental',
  model: string,
  vocalGenders: Tag[],
  excludedElements: Tag[],
  handleGeneratePrompt: (shouldSwitchTab: boolean, currentBatchHistory: {title: string, lyrics: string}[]) => Promise<GeneratedPrompt | null>,
  setLibraryTab: (tab: 'music' | 'prompts') => void,
  setError: React.Dispatch<React.SetStateAction<string>>,
  setSuccess: React.Dispatch<React.SetStateAction<string>>
) => {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('generated_songs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing songs from localStorage:', e);
      return [];
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [wavPollingTasks, setWavPollingTasks] = useState<Record<string, string>>({});
  const [isGeneratingWav, setIsGeneratingWav] = useState<Record<string, boolean>>({});

  const songsRef = useRef(songs);
  useEffect(() => {
    songsRef.current = songs;
    try {
      localStorage.setItem('generated_songs', JSON.stringify(songs));
    } catch (e) {
      console.error('Error saving songs to localStorage:', e);
    }
  }, [songs]);

  const isRequestingRef = useRef(isRequesting);
  useEffect(() => {
    isRequestingRef.current = isRequesting;
  }, [isRequesting]);

  useEffect(() => {
    if (!isRequesting && taskIds.length === 0 && isGenerating) {
      setIsGenerating(false);
    }
  }, [isRequesting, taskIds, isGenerating]);

  // Polling logic for status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (taskIds.length > 0 && isGenerating) {
      intervalId = setInterval(async () => {
        const currentTaskIds = [...taskIds];
        
        for (const currentTaskId of currentTaskIds) {
          try {
            const response = await axios.get(`/api/suno/status/${currentTaskId}?baseUrl=${encodeURIComponent(baseUrl)}`, {
              headers: { Authorization: `Bearer ${apiKey}` }
            });
            
            let data = response.data;
            if (data && data.code === 200 && data.data) {
              data = data.data;
            }
            
            if (data) {
              let sunoData: any[] = [];
              let status = '';
              let errorMessage = '';

              if (Array.isArray(data)) {
                sunoData = data;
                const allHaveAudio = sunoData.every(s => s.audioUrl || s.audio_url || s.url || s.play_url || s.cdn_url);
                status = allHaveAudio ? 'SUCCESS' : 'PROCESSING';
              } else {
                status = data.status || data.state || '';
                errorMessage = data.errorMessage || data.error || data.msg || '';
                sunoData = data.response?.sunoData || data.data || (Array.isArray(data.songs) ? data.songs : []);
                
                if (sunoData.length === 0 && (data.id || data.audio_url || data.audioUrl || data.url)) {
                  sunoData = [data];
                }
              }
              
              const isError = status === 'FAILED' || status === 'ERROR' || status === 'error' || errorMessage;
              const hasAudioUrls = sunoData.length > 0 && sunoData.every(s => s.audioUrl || s.audio_url || s.url || s.play_url || s.cdn_url || s.stream_url);
              const isSuccess = (status === 'SUCCESS' || status === 'complete' || status === 'COMPLETED' || status === 'FINISHED' || 
                                status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS' || status === 'done') && hasAudioUrls;

              if (isSuccess || isError || status === 'PROCESSING' || status === 'streaming' || status === 'QUEUED' || status === 'SUCCESS' || status === 'complete' || status === 'pending') {
                if (sunoData.length > 0) {
                  setSongs(prev => {
                    const updated = [...prev];
                    sunoData.forEach((newSong: any, index: number) => {
                      const audioUrl = newSong.audioUrl || newSong.audio_url || newSong.url || newSong.play_url || newSong.cdn_url || newSong.stream_url || '';
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
                    if (newIds.length === 0 && !isRequestingRef.current) setIsGenerating(false);
                    return newIds;
                  });
                }
              } else if (status === 'FAILED' || status === 'ERROR' || status.includes('FAILED') || status.includes('ERROR')) {
                setError(prev => prev ? `${prev}\n오류: ${errorMessage || status}` : `오류: ${errorMessage || status}`);
                setTaskIds(prev => {
                  const newIds = prev.filter(id => id !== currentTaskId);
                  if (newIds.length === 0 && !isRequestingRef.current) setIsGenerating(false);
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
    const currentWavTaskIds = Object.keys(wavPollingTasks);
    
    if (currentWavTaskIds.length > 0) {
      // Keep track of poll counts to prevent infinite polling
      const pollCounts: Record<string, number> = {};

      intervalId = setInterval(async () => {
        const tasksToPoll = { ...wavPollingTasks };
        for (const songId of Object.keys(tasksToPoll)) {
          const tId = tasksToPoll[songId];
          pollCounts[songId] = (pollCounts[songId] || 0) + 1;

          // Timeout after 5 minutes (60 polls * 5s)
          if (pollCounts[songId] > 60) {
            setWavPollingTasks(prev => {
              const newTasks = { ...prev };
              delete newTasks[songId];
              return newTasks;
            });
            setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
            setError('WAV 변환 시간이 초과되었습니다. 나중에 다시 시도해주세요.');
            continue;
          }

          try {
            const response = await axios.get(`/api/suno/wav/record-info?taskId=${tId}&baseUrl=${encodeURIComponent(baseUrl)}`, {
              headers: { Authorization: `Bearer ${apiKey}` }
            });
            
            let data = response.data;
            // Handle common wrapper formats
            if (data && (data.code === 200 || data.code === 0)) {
              data = data.data || data;
            }
            
            if (data) {
              // Try multiple possible paths for the WAV URL
              const wavUrl = data.response?.audioWavUrl || 
                             data.response?.wavUrl || 
                             data.wavUrl || 
                             data.audioWavUrl ||
                             data.audio_wav_url ||
                             data.url;

              // Try multiple possible paths for status
              const status = (data.successFlag || data.status || data.state || '').toString().toUpperCase();
              
              if (wavUrl && (status === 'SUCCESS' || status === 'COMPLETE' || status === '1' || data.successFlag === true)) {
                setSongs(prev => prev.map(s => s.id === songId ? { ...s, wav_url: wavUrl } : s));
                setWavPollingTasks(prev => {
                  const newTasks = { ...prev };
                  delete newTasks[songId];
                  return newTasks;
                });
                setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
                
                const song = songsRef.current.find(s => s.id === songId);
                const title = song?.title || 'Untitled';
                downloadWavFile(wavUrl, title);
              } else if (status === 'FAILED' || status === 'ERROR' || status === 'CREATE_TASK_FAILED' || status === 'GENERATE_AUDIO_FAILED') {
                setWavPollingTasks(prev => {
                  const newTasks = { ...prev };
                  delete newTasks[songId];
                  return newTasks;
                });
                setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
                setError(`WAV 변환 실패: ${data.errorMessage || data.msg || '오디오 변환 중 오류가 발생했습니다.'}`);
              }
            }
          } catch (err: any) {
            console.error('WAV Status check error:', err);
            // If it's a 404, maybe the task is still being created? 
            // But if it persists, we should stop.
            if (err.response?.status === 404 && pollCounts[songId] > 10) {
               // Stop after 10 failed attempts with 404
               setWavPollingTasks(prev => {
                const newTasks = { ...prev };
                delete newTasks[songId];
                return newTasks;
              });
              setIsGeneratingWav(prev => ({ ...prev, [songId]: false }));
            }
          }
        }
      }, 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [wavPollingTasks, apiKey, baseUrl]);

  const downloadWavFile = async (wavUrl: string, title: string) => {
    const safeTitle = (title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}.wav`;
    const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(wavUrl)}`;

    try {
      setSuccess(`'${fileName}' 다운로드를 준비 중입니다...`);
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
      
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('파일이 비어 있습니다.');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Delay revocation to ensure download starts in all browsers
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setSuccess(`'${fileName}' 다운로드가 시작되었습니다.`);
    } catch (err: any) {
      console.error('WAV download failed:', err);
      setError(`WAV 파일 다운로드에 실패했습니다: ${err.message}`);
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
        // Handle common wrapper formats
        let resData = response.data;
        if (resData.code === 200 || resData.code === 0) {
          resData = resData.data || resData;
        }

        let newTaskId = resData.taskId || resData.task_id || resData.id;
        
        if (!newTaskId && Array.isArray(resData) && resData.length > 0) {
          newTaskId = resData[0].taskId || resData[0].task_id || resData[0].id;
        }

        const directWavUrl = resData.wavUrl || resData.audioWavUrl || resData.audioUrl || resData.url;

        if (newTaskId && newTaskId !== song.taskId && newTaskId !== song.id) {
          setSuccess('WAV 변환 요청이 시작되었습니다. 완료 시 다운로드 버튼이 활성화됩니다.');
          setWavPollingTasks(prev => ({ ...prev, [song.id]: newTaskId }));
        } else if (directWavUrl && directWavUrl.toLowerCase().includes('.wav')) {
          setSuccess('WAV 변환이 완료되었습니다.');
          setSongs(prev => prev.map(s => s.id === song.id ? { ...s, wav_url: directWavUrl } : s));
          setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
          downloadWavFile(directWavUrl, song.title);
        } else if (newTaskId) {
          // If we got a taskId but it's the same as before, still poll
          setSuccess('WAV 변환 상태를 확인 중입니다...');
          setWavPollingTasks(prev => ({ ...prev, [song.id]: newTaskId }));
        } else {
          // If we have nothing, maybe it's already done?
          if (song.audio_url?.toLowerCase().includes('.wav') || song.wav_url) {
            setSuccess('이미 WAV 형식이거나 변환이 완료되었습니다.');
            setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
            downloadWavFile(song.wav_url || song.audio_url!, song.title);
          } else {
            throw new Error('변환 요청에 실패했습니다. (Task ID를 생성할 수 없음)');
          }
        }
      }
    } catch (err: any) {
      console.error('WAV generation failed:', err);
      setIsGeneratingWav(prev => ({ ...prev, [song.id]: false }));
      setError(`WAV 변환 요청 실패: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDownload = async (song: Song, e: React.MouseEvent) => {
    e.preventDefault();
    if (!song.audio_url) {
      setError('다운로드할 수 있는 오디오 URL이 없습니다.');
      return;
    }
    
    const safeTitle = (song.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}.mp3`;
    const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(song.audio_url)}`;

    try {
      setSuccess(`'${fileName}' 다운로드를 준비 중입니다...`);
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
      
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('파일이 비어 있습니다.');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Delay revocation to ensure download starts in all browsers
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      setSuccess(`'${fileName}' 다운로드가 시작되었습니다.`);
    } catch (err: any) {
      console.error('Download failed:', err);
      setError(`파일 다운로드에 실패했습니다: ${err.message}`);
    }
  };

  const handleBatchDownload = async (selectedSongs: Set<string>) => {
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
          if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
          const blob = await response.blob();
          if (blob.size === 0) throw new Error('파일이 비어 있습니다.');
          folder?.file(fileName, blob);
        } catch (err: any) {
          console.error(`Error downloading ${fileName}:`, err.message);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const now = new Date();
      const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
      const zipFileName = `suno_${dateStr}_${timeStr}.zip`;
      
      saveAs(content, zipFileName);
      setSuccess('압축 파일 다운로드가 완료되었습니다.');
    } catch (err: any) {
      setError('대량 다운로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleBatchDelete = (selectedSongs: Set<string>) => {
    if (selectedSongs.size === 0) return;
    setSongs(prev => prev.filter(s => !selectedSongs.has(s.id)));
    setSelectedSongs(new Set());
    setSuccess(`${selectedSongs.size}개의 곡이 삭제되었습니다.`);
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
    setLibraryTab('music');

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
        const promptToUse = await handleGeneratePrompt(false, currentBatchHistory);
        if (!promptToUse) continue;
        
        currentBatchHistory.push({ title: promptToUse.title, lyrics: promptToUse.lyrics });
        setLibraryTab('music');

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
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
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
        } else if (response.data && (response.data.task_id || response.data.taskId)) {
          const taskId = String(response.data.task_id || response.data.taskId);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        }

        if (genCount > 1 && i < genCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err: any) {
      console.error('Music generation error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || '음악 생성 요청에 실패했습니다.');
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
    } finally {
      setIsRequesting(false);
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
    }
  };

  const handleBatchGenerate = async (prompts: GeneratedPrompt[], selectedPrompts: Set<string>) => {
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
    
    try {
      let currentIdx = 0;
      let gender = '';
      if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('여성') || safeString(t.label).toLowerCase().includes('female')))) {
        gender = 'f';
      } else if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('남성') || safeString(t.label).toLowerCase().includes('male')))) {
        gender = 'm';
      }

      for (const promptToUse of promptsToGenerate) {
        currentIdx++;
        setGenerationProgress(prev => ({ ...prev, current: currentIdx }));
        
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
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          const slicedData = response.data.slice(0, 2);
          setSongs(prev => [...slicedData, ...prev]);
          const ids = slicedData.map((s: any) => String(s.id)).filter((id: string) => id.trim());
          setTaskIds(prev => [...prev, ...ids]);
        } else if (response.data && (response.data.task_id || response.data.taskId)) {
          const taskId = String(response.data.task_id || response.data.taskId);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        }

        if (currentIdx < promptsToGenerate.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err: any) {
      console.error('Batch generation error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || '대량 생성 요청에 실패했습니다.');
    } finally {
      setIsRequesting(false);
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
    }
  };

  const recheckStatus = async (song: Song) => {
    if (!song.taskId && !song.id) return;
    const tId = song.taskId || song.id;
    setTaskIds(prev => Array.from(new Set([...prev, tId])));
    setIsGenerating(true);
    setSuccess('상태 재확인을 시작합니다.');
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSongs(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleDelete = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    setSuccess('음악이 삭제되었습니다.');
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
    setLibraryTab('music');

    try {
      let gender = '';
      if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('여성') || safeString(t.label).toLowerCase().includes('female')))) {
        gender = 'f';
      } else if ((vocalGenders || []).some(t => t && (safeString(t.label).includes('남성') || safeString(t.label).toLowerCase().includes('male')))) {
        gender = 'm';
      }

      for (let i = 0; i < genCount; i++) {
        setGenerationProgress(prev => ({ ...prev, current: i + 1 }));
        
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
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          const slicedData = response.data.slice(0, 2);
          setSongs(prev => [...slicedData, ...prev]);
          const ids = slicedData.map((s: any) => String(s.id)).filter((id: string) => id.trim());
          setTaskIds(prev => [...prev, ...ids]);
        } else if (response.data && (response.data.task_id || response.data.taskId)) {
          const taskId = String(response.data.task_id || response.data.taskId);
          setTaskIds(prev => [...prev, ...taskId.split(',').filter(id => id.trim())]);
        }

        if (genCount > 1 && i < genCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err: any) {
      console.error('Music generation error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || '음악 생성 요청에 실패했습니다.');
    } finally {
      setIsRequesting(false);
      setTaskIds(prev => {
        if (prev.length === 0) setIsGenerating(false);
        return prev;
      });
    }
  };

  const toggleSongSelection = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedSongs(newSelected);
  };

  const selectAllSongs = (filteredIds?: string[]) => {
    const idsToSelect = filteredIds || songs.map(s => s.id);
    const allSelected = idsToSelect.length > 0 && idsToSelect.every(id => selectedSongs.has(id));
    
    if (allSelected) {
      const newSelected = new Set(selectedSongs);
      idsToSelect.forEach(id => newSelected.delete(id));
      setSelectedSongs(newSelected);
    } else {
      const newSelected = new Set(selectedSongs);
      idsToSelect.forEach(id => newSelected.add(id));
      setSelectedSongs(newSelected);
    }
  };

  const selectSongsByRange = (range: 'hour' | 'today' | '24h' | '7d', filteredIds?: string[]) => {
    const now = new Date();
    let cutoff: Date;
    
    switch (range) {
      case 'hour': cutoff = new Date(now.getTime() - 60 * 60 * 1000); break;
      case 'today': cutoff = new Date(now.setHours(0, 0, 0, 0)); break;
      case '24h': cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      default: return;
    }

    const idsToSelect: string[] = [];
    const idsToCheck = filteredIds ? new Set(filteredIds) : new Set(songs.map(s => s.id));
    
    songs.forEach(s => {
      if (!idsToCheck.has(s.id)) return;
      const createdAt = new Date(s.created_at);
      if (createdAt >= cutoff) {
        idsToSelect.push(s.id);
      }
    });
    
    if (idsToSelect.length === 0) return;

    const allSelected = idsToSelect.every(id => selectedSongs.has(id));
    const newSelected = new Set(selectedSongs);
    
    if (allSelected) {
      // Toggle off
      idsToSelect.forEach(id => newSelected.delete(id));
    } else {
      // Add to selection
      idsToSelect.forEach(id => newSelected.add(id));
    }
    setSelectedSongs(newSelected);
  };

  const selectGroupSongs = (songIds: string[]) => {
    const newSelected = new Set(selectedSongs);
    const allSelected = songIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      songIds.forEach(id => newSelected.delete(id));
    } else {
      songIds.forEach(id => newSelected.add(id));
    }
    setSelectedSongs(newSelected);
  };

  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());

  const handleDownloadWav = async (song: Song, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!song.wav_url) return;
    await downloadWavFile(song.wav_url, song.title);
  };

  return {
    songs,
    setSongs,
    isGenerating,
    isRequesting,
    generationProgress,
    isGeneratingWav,
    handleGenerateWav,
    handleDownload,
    handleBatchDownload,
    handleBatchDelete,
    handleGenerate,
    handleBatchGenerate,
    recheckStatus,
    toggleFavorite,
    handleDelete,
    handleGenerateFromPrompt,
    selectedSongs,
    setSelectedSongs,
    toggleSongSelection,
    selectAllSongs,
    selectSongsByRange,
    selectGroupSongs,
    handleDownloadWav
  };
};
