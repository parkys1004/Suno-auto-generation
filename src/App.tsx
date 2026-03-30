import React, { useMemo, useRef } from 'react';
import { 
  Music, Loader2, Search, ArrowUp, Play, Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Song, GeneratedPrompt } from './types';
import { removeTag } from './utils/helpers';

import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { NowPlaying } from './components/NowPlaying';
import { MusicLibrary } from './components/MusicLibrary';
import { PromptLibrary } from './components/PromptLibrary';
import { GenerationForm } from './components/GenerationForm';
import { ManualModal } from './components/ManualModal';
import { ConfirmModal } from './components/ConfirmModal';

import { useUIState } from './hooks/useUIState';
import { useSettings } from './hooks/useSettings';
import { usePromptGeneration } from './hooks/usePromptGeneration';
import { useSunoApi } from './hooks/useSunoApi';
import { useAudioPlayer } from './hooks/useAudioPlayer';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    showScrollTop,
    isManualOpen, setIsManualOpen,
    isApiModalOpen, setIsApiModalOpen,
    confirmConfig, setConfirmConfig,
    requestConfirm,
    libraryScrollRef,
    scrollToTop,
    error, setError,
    success, setSuccess,
    libraryTab, setLibraryTab,
    editingPromptId, setEditingPromptId,
    editPromptData, setEditPromptData,
    selectedPrompts, setSelectedPrompts,
    searchQuery, setSearchQuery,
    filter, setFilter,
    sortBy, setSortBy,
    selectedSongs, setSelectedSongs
  } = useUIState();

  const {
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
  } = useSettings(requestConfirm, setSuccess, setError);

  const {
    prompts, setPrompts,
    generatedHistory, setGeneratedHistory,
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
  } = usePromptGeneration(
    description, geminiApiKey, chatgptApiKey, promptModel,
    setGenres, setSubGenres, setMoods, setInstruments, setExcludedElements,
    setVocalGenders, setVocalTypes, setMusicType, setTempo, setMainLanguage,
    setLyricsLengthWithSpaces, setLyricsLengthWithoutSpaces, setError, setSuccess
  );

  const {
    songs, setSongs,
    isGenerating,
    isRequesting,
    generationProgress,
    isGeneratingWav,
    handleGenerateWav,
    handleDownload,
    handleBatchDownload,
    handleGenerate,
    handleBatchGenerate,
    recheckStatus,
    toggleFavorite,
    handleDelete,
    handleGenerateFromPrompt,
    toggleSongSelection,
    selectAllSongs,
    selectSongsByRange,
    selectGroupSongs,
    handleDownloadWav
  } = useSunoApi(
    apiKey, baseUrl, genCount, musicType, model, vocalGenders, excludedElements,
    handleGeneratePrompt, setLibraryTab, setError, setSuccess
  );

  const {
    currentSong,
    isPlaying, setIsPlaying,
    currentTime,
    duration,
    volume,
    audioRef,
    handleTimeUpdate,
    handleSeek,
    handleVolumeChange,
    playSong,
    formatTime
  } = useAudioPlayer(songs);

  const handleExtend = (song: Song) => {
    setSuccess('확장 기능은 아직 준비 중입니다.');
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
          handleGeneratePrompts={() => handleGeneratePrompts(genCount, setLibraryTab)}
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
                      onClick={() => selectAllPrompts(setSelectedPrompts)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                    >
                      전체 선택
                    </button>
                    <button 
                      onClick={() => selectTodayPrompts(setSelectedPrompts)}
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
                          requestConfirm('프롬프트 삭제', `${selectedPrompts.size}개의 프롬프트를 삭제하시겠습니까?`, () => {
                            setPrompts(prev => prev.filter(p => !selectedPrompts.has(p.id)));
                            setSelectedPrompts(new Set());
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                      >
                        {selectedPrompts.size}개 삭제
                      </button>
                      <button 
                        onClick={() => handleBatchGenerate(prompts, selectedPrompts)}
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
                handleBatchDownload={() => handleBatchDownload(selectedSongs)}
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
                handleSavePrompt={(id) => handleSavePrompt(id, editPromptData)}
                handleDeletePrompt={handleDeletePrompt}
                handleCopyPrompt={(text) => navigator.clipboard.writeText(text)}
                handleGenerateFromPrompt={handleGenerateFromPrompt}
                selectedPrompts={selectedPrompts}
                togglePromptSelection={(id) => togglePromptSelection(id, selectedPrompts, setSelectedPrompts)}
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
        src={currentSong?.audio_url ? `/api/proxy/audio?url=${encodeURIComponent(currentSong.audio_url)}` : undefined}
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
                  <img src={currentSong.image_url || undefined} alt={currentSong.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
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
