import { useState, useEffect, useRef } from 'react';
import { Song } from '../types';

export const useAudioPlayer = (songs: Song[]) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  return {
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    volume,
    audioRef,
    handleTimeUpdate,
    handleSeek,
    handleVolumeChange,
    playSong,
    formatTime
  };
};
