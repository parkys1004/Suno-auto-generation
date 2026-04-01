import React, { useState } from 'react';
import { Music, Play, Pause, Download, FileAudio, Loader2, Trash2, Heart, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Song } from '../types';

interface MusicLibraryProps {
  songs: Song[];
  searchQuery: string;
  filter: 'all' | 'complete' | 'favorite';
  sortBy: 'newest' | 'oldest' | 'title';
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  handleGenerateWav: (song: Song, e: React.MouseEvent) => void;
  handleDownloadWav: (song: Song, e: React.MouseEvent) => void;
  handleDownload: (song: Song, e: React.MouseEvent) => void;
  handleDelete: (id: string) => void;
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  isGeneratingWav: Record<string, boolean>;
  selectedSongs: Set<string>;
  toggleSongSelection: (id: string, e: React.MouseEvent) => void;
  selectAllSongs: (filteredIds?: string[]) => void;
  selectSongsByRange: (range: 'hour' | 'today' | '24h' | '7d', filteredIds?: string[]) => void;
  selectGroupSongs: (songIds: string[]) => void;
  handleBatchDownload: () => void;
  handleBatchDelete: () => void;
}

export function MusicLibrary({
  songs,
  searchQuery,
  filter,
  sortBy,
  currentSong,
  isPlaying,
  playSong,
  handleGenerateWav,
  handleDownloadWav,
  handleDownload,
  handleDelete,
  toggleFavorite,
  isGeneratingWav,
  selectedSongs,
  toggleSongSelection,
  selectAllSongs,
  selectSongsByRange,
  selectGroupSongs,
  handleBatchDownload,
  handleBatchDelete
}: MusicLibraryProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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

  // Apply sorting
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  const groupedByDate = sortedSongs.reduce((acc, song) => {
    const date = new Date(song.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let group = '이전';
    if (date.toDateString() === today.toDateString()) group = '오늘';
    else if (date.toDateString() === yesterday.toDateString()) group = '어제';
    else {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (date > weekAgo) group = '최근 7일';
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const groups = ['오늘', '어제', '최근 7일', '이전'];

  if (filteredSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <Music className="w-12 h-12 mb-4 opacity-20" />
        <p>생성된 음악이 없습니다</p>
      </div>
    );
  }

  const allSelected = selectedSongs.size > 0 && filteredSongs.every(s => selectedSongs.has(s.id));

  return (
    <div className="space-y-8">
      {/* Bulk Actions Bar */}
      <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] sticky top-0 z-20 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
            <button 
              onClick={() => selectAllSongs(filteredSongs.map(s => s.id))}
              className="flex items-center justify-center pl-3 pr-2 py-1.5 hover:text-[var(--accent-primary)] transition-colors"
              title="전체 선택/해제"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allSelected ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--text-secondary)]'}`}>
                {allSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
            </button>
            
            <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
            
            <button 
              onClick={() => setShowSelectionMenu(!showSelectionMenu)}
              className="flex items-center gap-1.5 pr-3 pl-2 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              선택 옵션
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSelectionMenu ? 'rotate-180' : ''}`} />
            </button>

            {showSelectionMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowSelectionMenu(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => { selectSongsByRange('hour', filteredSongs.map(s => s.id)); setShowSelectionMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors"
                  >
                    최근 1시간 이내
                  </button>
                  <button 
                    onClick={() => { selectSongsByRange('today', filteredSongs.map(s => s.id)); setShowSelectionMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors"
                  >
                    오늘 생성된 곡
                  </button>
                  <button 
                    onClick={() => { selectSongsByRange('24h', filteredSongs.map(s => s.id)); setShowSelectionMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors"
                  >
                    최근 24시간 이내
                  </button>
                  <button 
                    onClick={() => { selectSongsByRange('7d', filteredSongs.map(s => s.id)); setShowSelectionMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors"
                  >
                    최근 7일 이내
                  </button>
                </div>
              </>
            )}
          </div>
          
          {selectedSongs.size > 0 && (
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              {selectedSongs.size}개 선택됨
            </span>
          )}
        </div>
        
        {selectedSongs.size > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              선택 삭제
            </button>
            <button 
              onClick={handleBatchDownload}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-[var(--accent-primary)]/20"
            >
              <Download className="w-3.5 h-3.5" />
              선택 다운로드 (ZIP)
            </button>
          </div>
        )}
      </div>

      {groups.map(group => {
        const groupSongs = groupedByDate[group];
        if (!groupSongs || groupSongs.length === 0) return null;
        
        const isCollapsed = collapsedGroups[group];
        const groupIds = groupSongs.map(s => s.id);
        const allGroupSelected = groupIds.every(id => selectedSongs.has(id));
        
        return (
          <div key={group} className="space-y-4">
            <div className="flex items-center justify-between group/header">
              <button 
                onClick={() => toggleGroup(group)}
                className="flex items-center gap-3"
              >
                <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] group-hover/header:text-[var(--accent-primary)] transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{group}</h3>
                <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                  {groupSongs.length}
                </span>
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />}
              </button>

              <button 
                onClick={() => selectGroupSongs(groupIds)}
                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${allGroupSelected ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)]'}`}
              >
                {allGroupSelected ? '그룹 선택 해제' : `${group} 전체 선택`}
              </button>
            </div>
            
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupSongs.map((song) => (
                  <div 
                    key={song.id}
                    onClick={() => playSong(song)}
                    className={`group bg-[var(--bg-secondary)] border ${selectedSongs.has(song.id) ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20' : currentSong?.id === song.id ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5' : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/30'} rounded-2xl p-4 transition-all cursor-pointer hover:shadow-xl hover:shadow-black/20 relative`}
                  >
                    {/* Selection Checkbox */}
                    <div 
                      onClick={(e) => toggleSongSelection(song.id, e)}
                      className={`absolute top-3 left-3 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedSongs.has(song.id) ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] scale-110' : 'bg-black/20 border-white/50 opacity-0 group-hover:opacity-100'}`}
                    >
                      {selectedSongs.has(song.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>

                    <div className="flex gap-4">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-primary)] shadow-lg">
                        {song.image_url ? (
                          <img src={song.image_url || null} alt={song.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-8 h-8 text-[var(--text-secondary)] opacity-50" />
                          </div>
                        )}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${currentSong?.id === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {currentSong?.id === song.id && isPlaying ? (
                            <Pause className="w-8 h-8 text-[var(--text-on-accent)] fill-current" />
                          ) : (
                            <Play className="w-8 h-8 text-[var(--text-on-accent)] fill-current ml-1" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-base font-bold text-[var(--text-primary)] truncate">{song.title || 'Untitled Song'}</h4>
                          <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                            {new Date(song.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] truncate mb-2">{song.tags}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            song.status === 'complete' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-text)] border border-[var(--accent-primary)]/20' : 
                            song.status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {song.status}
                          </span>
                          {song.status === 'complete' && (
                            <button 
                              onClick={(e) => toggleFavorite(song.id, e)}
                              className="p-1 hover:bg-[var(--bg-primary)] rounded-md transition-colors"
                            >
                              <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-red-500 text-red-500' : 'text-[var(--text-secondary)] hover:text-red-400'}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-4">
                      {song.status === 'complete' && (
                        <>
                          {song.audio_url && !song.audio_url.includes('.wav') && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleGenerateWav(song, e); }}
                              disabled={isGeneratingWav[song.id]}
                              className="p-1.5 hover:bg-[var(--bg-primary)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors disabled:opacity-50"
                              title="WAV 고음질 변환"
                            >
                              {isGeneratingWav[song.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileAudio className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {song.audio_url?.includes('.wav') && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDownloadWav(song, e); }}
                              className="p-1.5 hover:bg-[var(--bg-primary)] rounded-md text-[var(--accent-text)] hover:opacity-80 transition-colors"
                              title="WAV 다운로드"
                            >
                              <FileAudio className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(song, e); }}
                            className="p-1.5 hover:bg-[var(--bg-primary)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            title="MP3 다운로드"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(song.id); }}
                        className="p-1.5 hover:bg-[var(--bg-primary)] rounded-md text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
