import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react';
import { Song } from '../types';

interface NowPlayingProps {
  currentSong: Song | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export function NowPlaying({ currentSong, isPlaying, setIsPlaying }: NowPlayingProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error(e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full lg:w-[20%] h-[500px] lg:h-auto flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-color)] relative shrink-0">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Music className="w-5 h-5 text-[var(--text-secondary)]" />
          Now Playing
        </h2>
      </div>

      {currentSong ? (
        <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8">
            {/* 앨범 아트 */}
            <div className="w-full max-w-[200px] sm:max-w-[256px] aspect-square rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl relative group shrink-0">
              {currentSong.image_url ? (
                <img 
                  src={currentSong.image_url} 
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
                  onChange={handleSeek}
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
                    onChange={handleVolumeChange}
                    className="w-32 h-1 bg-[var(--bg-primary)] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--text-primary)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                  />
                </div>
              </div>
              
              <audio 
                ref={audioRef} 
                src={`/api/proxy/audio?url=${encodeURIComponent(currentSong.audio_url)}`} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={handleTimeUpdate}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* 가사 */}
            {currentSong.lyric && (
              <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-4 uppercase tracking-widest">Lyrics</h3>
                <pre className="text-[var(--text-primary)] font-sans whitespace-pre-wrap leading-relaxed">
                  {currentSong.lyric}
                </pre>
              </div>
            )}
          </div>
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
