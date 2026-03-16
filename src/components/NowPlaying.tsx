import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Loader2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Song } from '../types';

interface NowPlayingProps {
  currentSong: Song | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  recheckStatus: (song: Song) => void;
  currentTime: number;
  duration: number;
  volume: number;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
}

export function NowPlaying({ 
  currentSong, 
  isPlaying, 
  setIsPlaying, 
  recheckStatus,
  currentTime,
  duration,
  volume,
  onSeek,
  onVolumeChange
}: NowPlayingProps) {
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics'>('player');

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(Number(e.target.value));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full lg:w-[20%] h-[500px] lg:h-auto flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-color)] relative shrink-0">
      <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Music className="w-5 h-5 text-[var(--text-secondary)]" />
          {activeTab === 'player' ? 'Now Playing' : 'Lyrics'}
        </h2>
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
          <button 
            onClick={() => setActiveTab('player')}
            className={`p-1.5 rounded-lg transition-all ${activeTab === 'player' ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="플레이어"
          >
            <Music className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setActiveTab('lyrics')}
            className={`p-1.5 rounded-lg transition-all ${activeTab === 'lyrics' ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="가사"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {currentSong ? (
        <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          {currentSong.status !== 'complete' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4">
              <Loader2 className="w-12 h-12 animate-spin opacity-20" />
              <div className="text-center">
                <p className="font-bold">음악을 준비 중입니다...</p>
                <p className="text-xs opacity-60">상태: {currentSong.status}</p>
              </div>
            </div>
          ) : !currentSong.audio_url ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-500 opacity-50" />
              <div className="text-center space-y-2">
                <p className="font-bold">오디오 파일을 찾을 수 없습니다</p>
                <p className="text-xs opacity-60">서버에서 URL을 아직 생성하지 않았을 수 있습니다.</p>
              </div>
              <button 
                onClick={() => recheckStatus(currentSong)}
                className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl text-xs font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                상태 다시 확인
              </button>
            </div>
          ) : activeTab === 'player' ? (
            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8">
              {/* 앨범 아트 */}
              <div className="w-full max-w-[200px] sm:max-w-[256px] aspect-square rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl relative group shrink-0">
                {currentSong.image_url ? (
                  <img 
                    src={currentSong.image_url || null} 
                    alt={currentSong.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)]">
                    <Music className="w-16 h-16 text-[var(--text-secondary)] opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* 곡 정보 */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{currentSong.title || 'Untitled Song'}</h2>
                <p className="text-[var(--text-secondary)]">{currentSong.tags}</p>
              </div>

              {/* 플레이어 컨트롤 */}
              <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6">
                <div className="text-center mb-4">
                  <p className="text-xs text-[var(--text-secondary)]">{formatTime(currentTime)} / {formatTime(duration || 0)}</p>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <input 
                    type="range" 
                    min={0} 
                    max={duration || 100} 
                    value={currentTime} 
                    onChange={handleSeekChange}
                    className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--text-primary)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                  />
                </div>
                
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="flex items-center justify-center gap-8 w-full">
                    <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      <SkipBack className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-14 h-14 bg-[var(--text-primary)] rounded-full flex items-center justify-center text-[var(--bg-primary)] hover:scale-105 transition-transform shrink-0 shadow-lg"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>
                    <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full justify-center">
                    <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
                    <input 
                      type="range" 
                      min={0} 
                      max={1} 
                      step={0.01}
                      value={volume} 
                      onChange={handleVolumeSliderChange}
                      className="w-32 h-1 bg-[var(--bg-primary)] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--text-primary)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] shrink-0">
                  {currentSong.image_url ? (
                    <img src={currentSong.image_url || null} alt={currentSong.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 opacity-20" /></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">{currentSong.title || 'Untitled Song'}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{currentSong.tags}</p>
                </div>
              </div>
              
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-4 uppercase tracking-widest">Lyrics</h3>
                {currentSong.lyric ? (
                  <pre className="text-[var(--text-primary)] font-sans whitespace-pre-wrap leading-relaxed text-sm">
                    {currentSong.lyric}
                  </pre>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] italic">가사가 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)]">
          <Music className="w-16 h-16 mb-4 opacity-20" />
          <p>재생 중인 곡이 없습니다</p>
        </div>
      )}
    </div>
  );
}
