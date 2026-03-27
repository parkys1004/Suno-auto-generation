import React, { useState } from 'react';
import { 
  Sparkles, Loader2, ChevronDown, X, Sliders, 
  Languages, LayoutGrid, Music, AlertCircle, FolderOpen, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from '../types';
import { SUB_GENRE_MAP, DEFAULT_SUB_GENRES } from '../constants';

interface GenerationFormProps {
  description: string;
  setDescription: (val: string) => void;
  handleAutoSetup: () => void;
  isAutoSetting: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  
  genres: Tag[];
  setGenres: React.Dispatch<React.SetStateAction<Tag[]>>;

  subGenres: Tag[];
  setSubGenres: React.Dispatch<React.SetStateAction<Tag[]>>;

  musicType: 'vocal' | 'instrumental';
  setMusicType: (val: 'vocal' | 'instrumental') => void;

  vocalTypes: Tag[];
  setVocalTypes: React.Dispatch<React.SetStateAction<Tag[]>>;

  vocalGenders: Tag[];
  setVocalGenders: React.Dispatch<React.SetStateAction<Tag[]>>;

  tempo: number;
  setTempo: (val: number) => void;

  moods: Tag[];
  setMoods: React.Dispatch<React.SetStateAction<Tag[]>>;

  instruments: Tag[];
  setInstruments: React.Dispatch<React.SetStateAction<Tag[]>>;

  mainLanguage: string;
  setMainLanguage: (val: string) => void;
  subLanguage: string;
  setSubLanguage: (val: string) => void;
  subLanguageRatio: number;
  setSubLanguageRatio: (val: number) => void;
  model: string;
  setModel: (val: string) => void;

  excludedElements: Tag[];
  setExcludedElements: React.Dispatch<React.SetStateAction<Tag[]>>;

  additionalRequest: string;
  setAdditionalRequest: (val: string) => void;
  genCount: number;
  setGenCount: (val: number) => void;
  lyricsLengthWithSpaces: number;
  setLyricsLengthWithSpaces: (val: number) => void;
  lyricsLengthWithoutSpaces: number;
  setLyricsLengthWithoutSpaces: (val: number) => void;

  handleGeneratePrompts: () => void;
  handleGenerate: () => void;
  isGeneratingPrompt: boolean;
  isGenerating: boolean;
  error: string;
  success?: string;
  removeTag: (setFn: React.Dispatch<React.SetStateAction<Tag[]>>, id: string) => void;
  onReset: () => void;
}

export function GenerationForm({
  description, setDescription, handleAutoSetup, isAutoSetting,
  showAdvanced, setShowAdvanced,
  genres, setGenres,
  subGenres, setSubGenres,
  musicType, setMusicType,
  vocalTypes, setVocalTypes,
  vocalGenders, setVocalGenders,
  tempo, setTempo,
  moods, setMoods,
  instruments, setInstruments,
  mainLanguage, setMainLanguage, subLanguage, setSubLanguage, subLanguageRatio, setSubLanguageRatio,
  model, setModel,
  excludedElements, setExcludedElements,
  additionalRequest, setAdditionalRequest, genCount, setGenCount,
  lyricsLengthWithSpaces, setLyricsLengthWithSpaces, lyricsLengthWithoutSpaces, setLyricsLengthWithoutSpaces,
  handleGeneratePrompts, handleGenerate, isGeneratingPrompt, isGenerating, error, success, removeTag, onReset
}: GenerationFormProps) {
  // UI States for adding tags
  const [isAddingGenre, setIsAddingGenre] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [isAddingSubGenre, setIsAddingSubGenre] = useState(false);
  const [subGenreInput, setSubGenreInput] = useState('');
  const [isAddingVocalType, setIsAddingVocalType] = useState(false);
  const [vocalTypeInput, setVocalTypeInput] = useState('');
  const [isAddingVocalGender, setIsAddingVocalGender] = useState(false);
  const [vocalGenderInput, setVocalGenderInput] = useState('');
  const [isAddingMood, setIsAddingMood] = useState(false);
  const [moodInput, setMoodInput] = useState('');
  const [isAddingInstrument, setIsAddingInstrument] = useState(false);
  const [instrumentInput, setInstrumentInput] = useState('');
  const [isAddingExcluded, setIsAddingExcluded] = useState(false);
  const [excludedInput, setExcludedInput] = useState('');

  return (
    <div className="w-full lg:w-[40%] border-b lg:border-b-0 lg:border-r border-[var(--border-color)] lg:overflow-y-auto p-4 lg:p-6 space-y-8 custom-scrollbar shrink-0 bg-[var(--bg-primary)]">
      {/* Music Description */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">음악 설명</label>
          <button
            onClick={handleAutoSetup}
            disabled={isAutoSetting || !description.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[11px] font-bold hover:bg-[var(--accent-primary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAutoSetting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            AI 자동 설정
          </button>
        </div>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]/50 transition-all outline-none min-h-[120px] resize-none"
          placeholder="예: 카페에서 듣기 좋은 음악, 조용하고 차분한 음악, 90년대 감성 발라드 등"
        />
      </section>

      {/* Advanced Settings Toggle */}
      <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">고급 설정</h3>
          <p className="text-[11px] text-[var(--text-secondary)]">장르, 보컬, BPM 등 세부 옵션 제어</p>
        </div>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`w-12 h-6 rounded-full transition-colors relative ${showAdvanced ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-primary)]'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-[var(--text-on-accent)] rounded-full transition-all ${showAdvanced ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            {/* Genre & Sub-genre */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">장르</label>
                {!isAddingGenre ? (
                  <>
                    <div className="relative">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== '장르 선택...') {
                            if (!(genres || []).find(g => g && g.label === val)) {
                              setGenres([...(genres || []), { id: Math.random().toString(), label: val }]);
                            }
                            e.target.value = '장르 선택...';
                          }
                        }}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                      >
                        <option>장르 선택...</option>
                        <option>Pop</option>
                        <option>Jazz</option>
                        <option>Lo-fi</option>
                        <option>Rock</option>
                        <option>Hip Hop</option>
                        <option>R&B</option>
                        <option>Electronic</option>
                        <option>Classical</option>
                        <option>Country</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>
                    <button 
                      onClick={() => setIsAddingGenre(true)}
                      className="text-[11px] text-[var(--accent-text)] hover:opacity-80 transition-colors"
                    >
                      + 직접 추가
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (genreInput.trim()) {
                            setGenres([...(genres || []), { id: Math.random().toString(), label: genreInput.trim() }]);
                            setGenreInput('');
                            setIsAddingGenre(false);
                          }
                        }
                      }}
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)]/50"
                      placeholder="직접 입력..."
                    />
                    <button 
                      onClick={() => {
                        if (genreInput.trim()) {
                          setGenres([...(genres || []), { id: Math.random().toString(), label: genreInput.trim() }]);
                          setGenreInput('');
                          setIsAddingGenre(false);
                        }
                      }}
                      className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl text-sm font-bold hover:opacity-90 transition-colors"
                    >
                      추가
                    </button>
                    <button 
                      onClick={() => {
                        setGenreInput('');
                        setIsAddingGenre(false);
                      }}
                      className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl text-sm font-bold hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      취소
                    </button>
                  </div>
                )}
                
                {(genres || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(genres || []).map(tag => tag && (
                      <span key={tag.id} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg text-xs border border-[var(--border-color)]">
                        {tag.label}
                        <button onClick={() => removeTag(setGenres, tag.id)}><X className="w-3 h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">세부 장르</label>
                {!isAddingSubGenre ? (
                  <>
                    <div className="relative">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== '세부 장르 선택...') {
                            if (!(subGenres || []).find(g => g && g.label === val)) {
                              setSubGenres([...(subGenres || []), { id: Math.random().toString(), label: val }]);
                            }
                            e.target.value = '세부 장르 선택...';
                          }
                        }}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                      >
                        <option>세부 장르 선택...</option>
                        {(genres || []).length > 0 ? (
                          // Show sub-genres for all selected main genres
                          Array.from(new Set((genres || []).flatMap(g => (g && g.label) ? (SUB_GENRE_MAP[g.label] || []) : []))).map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        ) : (
                          // Show default sub-genres if no main genre is selected
                          (DEFAULT_SUB_GENRES || []).map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>
                    <button 
                      onClick={() => setIsAddingSubGenre(true)}
                      className="text-[11px] text-[var(--accent-text)] hover:opacity-80 transition-colors"
                    >
                      + 직접 추가
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      value={subGenreInput}
                      onChange={(e) => setSubGenreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (subGenreInput.trim()) {
                            setSubGenres([...(subGenres || []), { id: Math.random().toString(), label: subGenreInput.trim() }]);
                            setSubGenreInput('');
                            setIsAddingSubGenre(false);
                          }
                        }
                      }}
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)]/50"
                      placeholder="직접 입력..."
                    />
                    <button 
                      onClick={() => {
                        if (subGenreInput.trim()) {
                          setSubGenres([...(subGenres || []), { id: Math.random().toString(), label: subGenreInput.trim() }]);
                          setSubGenreInput('');
                          setIsAddingSubGenre(false);
                        }
                      }}
                      className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl text-sm font-bold hover:opacity-90 transition-colors"
                    >
                      추가
                    </button>
                    <button 
                      onClick={() => {
                        setSubGenreInput('');
                        setIsAddingSubGenre(false);
                      }}
                      className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl text-sm font-bold hover:bg-[var(--bg-primary)] transition-colors"
                    >
                      취소
                    </button>
                  </div>
                )}

                {(subGenres || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(subGenres || []).map(tag => tag && (
                      <span key={tag.id} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg text-xs border border-[var(--border-color)]">
                        {tag.label}
                        <button onClick={() => removeTag(setSubGenres, tag.id)}><X className="w-3 h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Music Type Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">음악 타입</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
                  <button 
                    onClick={() => setMusicType('vocal')}
                    className={`py-2.5 rounded-lg text-sm font-bold transition-all ${musicType === 'vocal' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    보컬
                  </button>
                  <button 
                    onClick={() => setMusicType('instrumental')}
                    className={`py-2.5 rounded-lg text-sm font-bold transition-all ${musicType === 'instrumental' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    인스트루멘탈
                  </button>
                </div>
              </div>
            </div>

            {/* Vocal Options */}
            {musicType === 'vocal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">보컬 타입</label>
                  {!isAddingVocalType ? (
                    <>
                      <div className="relative">
                        <select 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && val !== '보컬 타입 선택...') {
                              if (!(vocalTypes || []).find(g => g && g.label === val)) {
                                setVocalTypes([...(vocalTypes || []), { id: Math.random().toString(), label: val }]);
                              }
                              e.target.value = '보컬 타입 선택...';
                            }
                          }}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                        >
                          <option>보컬 타입 선택...</option>
                          <option value="맑은 (Clean)">맑은 (Clean)</option>
                          <option value="허스키한 (Husky)">허스키한 (Husky)</option>
                          <option value="거친 (Raspy)">거친 (Raspy)</option>
                          <option value="파워풀한 (Powerful)">파워풀한 (Powerful)</option>
                          <option value="부드러운 (Soft)">부드러운 (Soft)</option>
                          <option value="속삭이는 (Whispering)">속삭이는 (Whispering)</option>
                          <option value="오페라 (Operatic)">오페라 (Operatic)</option>
                          <option value="랩 (Rap)">랩 (Rap)</option>
                          <option value="그로울링 (Growling)">그로울링 (Growling)</option>
                          <option value="가성 (Falsetto)">가성 (Falsetto)</option>
                          <option value="소울풀한 (Soulful)">소울풀한 (Soulful)</option>
                          <option value="코러스 (Chorus/Choir)">코러스 (Chorus/Choir)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                      </div>
                      <button 
                        onClick={() => setIsAddingVocalType(true)}
                        className="text-[11px] text-[var(--accent-text)] hover:opacity-80 transition-colors"
                      >
                        + 직접 추가
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        autoFocus
                        value={vocalTypeInput}
                        onChange={(e) => setVocalTypeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (vocalTypeInput.trim()) {
                              setVocalTypes([...(vocalTypes || []), { id: Math.random().toString(), label: vocalTypeInput.trim() }]);
                              setVocalTypeInput('');
                              setIsAddingVocalType(false);
                            }
                          }
                        }}
                        className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-primary)]/50"
                        placeholder="직접 입력..."
                      />
                      <button 
                        onClick={() => {
                          if (vocalTypeInput.trim()) {
                            setVocalTypes([...(vocalTypes || []), { id: Math.random().toString(), label: vocalTypeInput.trim() }]);
                            setVocalTypeInput('');
                            setIsAddingVocalType(false);
                          }
                        }}
                        className="px-3 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-xs font-bold"
                      >
                        추가
                      </button>
                      <button 
                        onClick={() => {
                          setVocalTypeInput('');
                          setIsAddingVocalType(false);
                        }}
                        className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg text-xs font-bold"
                      >
                        취소
                      </button>
                    </div>
                  )}

                  {(vocalTypes || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(vocalTypes || []).map(tag => tag && (
                        <span key={tag.id} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg text-xs border border-[var(--border-color)]">
                          {tag.label}
                          <button onClick={() => removeTag(setVocalTypes, tag.id)}><X className="w-3 h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">보컬 성별</label>
                  {!isAddingVocalGender ? (
                    <>
                      <div className="relative">
                        <select 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && val !== '보컬 성별 선택...') {
                              if (!(vocalGenders || []).find(g => g && g.label === val)) {
                                setVocalGenders([...(vocalGenders || []), { id: Math.random().toString(), label: val }]);
                              }
                              e.target.value = '보컬 성별 선택...';
                            }
                          }}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                        >
                          <option>보컬 성별 선택...</option>
                          <option value="여성 (Female)">여성 (Female)</option>
                          <option value="남성 (Male)">남성 (Male)</option>
                          <option value="소년 (Boy)">소년 (Boy)</option>
                          <option value="소녀 (Girl)">소녀 (Girl)</option>
                          <option value="중성적인 (Androgynous)">중성적인 (Androgynous)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                      </div>
                      <button 
                        onClick={() => setIsAddingVocalGender(true)}
                        className="text-[11px] text-[var(--accent-text)] hover:opacity-80 transition-colors"
                      >
                        + 직접 추가
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        autoFocus
                        value={vocalGenderInput}
                        onChange={(e) => setVocalGenderInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (vocalGenderInput.trim()) {
                              setVocalGenders([...(vocalGenders || []), { id: Math.random().toString(), label: vocalGenderInput.trim() }]);
                              setVocalGenderInput('');
                              setIsAddingVocalGender(false);
                            }
                          }
                        }}
                        className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-primary)]/50"
                        placeholder="직접 입력..."
                      />
                      <button 
                        onClick={() => {
                          if (vocalGenderInput.trim()) {
                            setVocalGenders([...(vocalGenders || []), { id: Math.random().toString(), label: vocalGenderInput.trim() }]);
                            setVocalGenderInput('');
                            setIsAddingVocalGender(false);
                          }
                        }}
                        className="px-3 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-xs font-bold"
                      >
                        추가
                      </button>
                      <button 
                        onClick={() => {
                          setVocalGenderInput('');
                          setIsAddingVocalGender(false);
                        }}
                        className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg text-xs font-bold"
                      >
                        취소
                      </button>
                    </div>
                  )}

                  {(vocalGenders || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(vocalGenders || []).map(tag => tag && (
                        <span key={tag.id} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg text-xs border border-[var(--border-color)]">
                          {tag.label}
                          <button onClick={() => removeTag(setVocalGenders, tag.id)}><X className="w-3 h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tempo Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">템포 (BPM: {tempo})</label>
                <div className="flex gap-2">
                  {[60, 80, 100, 120, 140].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTempo(t)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${tempo === t ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <input 
                type="range"
                min="40"
                max="200"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
              />
            </div>

            {/* Mood & Instruments */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">무드</label>
                {!isAddingMood ? (
                  <>
                    <div className="relative">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== '무드 선택...') {
                            if (!moods.find(g => g.label === val)) {
                              setMoods([...moods, { id: Math.random().toString(), label: val }]);
                            }
                            e.target.value = '무드 선택...';
                          }
                        }}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                      >
                        <option>무드 선택...</option>
                        <option value="차분한 (Calm)">차분한 (Calm)</option>
                        <option value="밝은 (Bright)">밝은 (Bright)</option>
                        <option value="슬픈 (Sad)">슬픈 (Sad)</option>
                        <option value="에너지 넘치는 (Energetic)">에너지 넘치는 (Energetic)</option>
                        <option value="몽환적인 (Dreamy)">몽환적인 (Dreamy)</option>
                        <option value="어두운 (Dark)">어두운 (Dark)</option>
                        <option value="긴장감 넘치는 (Tense)">긴장감 넘치는 (Tense)</option>
                        <option value="경쾌한 (Bouncy)">경쾌한 (Bouncy)</option>
                        <option value="장엄한 (Majestic)">장엄한 (Majestic)</option>
                        <option value="신비로운 (Mysterious)">신비로운 (Mysterious)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>
                    <button 
                      onClick={() => setIsAddingMood(true)}
                      className="text-[11px] text-[var(--accent-text)] hover:opacity-80 transition-colors"
                    >
                      + 직접 추가
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      value={moodInput}
                      onChange={(e) => setMoodInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (moodInput.trim()) {
                            setMoods([...(moods || []), { id: Math.random().toString(), label: moodInput.trim() }]);
                            setMoodInput('');
                            setIsAddingMood(false);
                          }
                        }
                      }}
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-primary)]/50"
                      placeholder="직접 입력..."
                    />
                    <button 
                      onClick={() => {
                        if (moodInput.trim()) {
                          setMoods([...(moods || []), { id: Math.random().toString(), label: moodInput.trim() }]);
                          setMoodInput('');
                          setIsAddingMood(false);
                        }
                      }}
                      className="px-3 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-xs font-bold"
                    >
                      추가
                    </button>
                    <button 
                      onClick={() => {
                        setMoodInput('');
                        setIsAddingMood(false);
                      }}
                      className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg text-xs font-bold"
                    >
                      취소
                    </button>
                  </div>
                )}

                {(moods || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(moods || []).map(tag => tag && (
                      <span key={tag.id} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg text-xs border border-[var(--border-color)]">
                        {tag.label}
                        <button onClick={() => removeTag(setMoods, tag.id)}><X className="w-3 h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">악기</label>
                {!isAddingInstrument ? (
                  <>
                    <div className="relative">
                      <select 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== '악기 선택...') {
                            if (!(instruments || []).find(g => g && g.label === val)) {
                              setInstruments([...(instruments || []), { id: Math.random().toString(), label: val }]);
                            }
                            e.target.value = '악기 선택...';
                          }
                        }}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                      >
                        <option>악기 선택...</option>
                        <option value="어쿠스틱 기타 (Acoustic Guitar)">어쿠스틱 기타 (Acoustic Guitar)</option>
                        <option value="일렉 기타 (Electric Guitar)">일렉 기타 (Electric Guitar)</option>
                        <option value="피아노 (Piano)">피아노 (Piano)</option>
                        <option value="신디사이저 (Synthesizer)">신디사이저 (Synthesizer)</option>
                        <option value="드럼 (Drums)">드럼 (Drums)</option>
                        <option value="베이스 (Bass)">베이스 (Bass)</option>
                        <option value="바이올린 (Violin)">바이올린 (Violin)</option>
                        <option value="첼로 (Cello)">첼로 (Cello)</option>
                        <option value="플루트 (Flute)">플루트 (Flute)</option>
                        <option value="브라스 섹션 (Brass Section)">브라스 섹션 (Brass Section)</option>
                        <option value="오케스트라 (Orchestra)">오케스트라 (Orchestra)</option>
                        <option value="합창 (Choir)">합창 (Choir)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>
                    <button 
                      onClick={() => setIsAddingInstrument(true)}
                      className="text-[11px] text-[var(--accent-text)] hover:opacity-80 transition-colors"
                    >
                      + 직접 추가
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      value={instrumentInput}
                      onChange={(e) => setInstrumentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (instrumentInput.trim()) {
                            setInstruments([...(instruments || []), { id: Math.random().toString(), label: instrumentInput.trim() }]);
                            setInstrumentInput('');
                            setIsAddingInstrument(false);
                          }
                        }
                      }}
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-primary)]/50"
                      placeholder="직접 입력..."
                    />
                    <button 
                      onClick={() => {
                        if (instrumentInput.trim()) {
                          setInstruments([...(instruments || []), { id: Math.random().toString(), label: instrumentInput.trim() }]);
                          setInstrumentInput('');
                          setIsAddingInstrument(false);
                        }
                      }}
                      className="px-3 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-xs font-bold"
                    >
                      추가
                    </button>
                    <button 
                      onClick={() => {
                        setInstrumentInput('');
                        setIsAddingInstrument(false);
                      }}
                      className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg text-xs font-bold"
                    >
                      취소
                    </button>
                  </div>
                )}

                {(instruments || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(instruments || []).map(tag => tag && (
                      <span key={tag.id} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg text-xs border border-[var(--border-color)]">
                        {tag.label}
                        <button onClick={() => removeTag(setInstruments, tag.id)}><X className="w-3 h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Language & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                  <Languages className="w-4 h-4" />
                  <span className="text-sm font-bold">언어 설정</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">주 언어</label>
                    <div className="relative">
                      <select 
                        value={mainLanguage}
                        onChange={(e) => setMainLanguage(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                      >
                        <option value="한국어">한국어 (Korean)</option>
                        <option value="영어">영어 (English)</option>
                        <option value="일본어">일본어 (Japanese)</option>
                        <option value="중국어">중국어 (Chinese)</option>
                        <option value="스페인어">스페인어 (Spanish)</option>
                        <option value="프랑스어">프랑스어 (French)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">보조 언어 (선택)</label>
                    <div className="relative">
                      <select 
                        value={subLanguage}
                        onChange={(e) => setSubLanguage(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                      >
                        <option value="">없음</option>
                        <option value="영어">영어 (English)</option>
                        <option value="한국어">한국어 (Korean)</option>
                        <option value="일본어">일본어 (Japanese)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>
                  </div>
                  {subLanguage && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">보조 언어 비중 ({subLanguageRatio}%)</label>
                      <input 
                        type="range"
                        min="10"
                        max="50"
                        step="10"
                        value={subLanguageRatio}
                        onChange={(e) => setSubLanguageRatio(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-bold">모델 설정</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Suno 모델 버전</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
                    <button 
                      onClick={() => setModel('V5')}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all ${model === 'V5' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      V5
                    </button>
                    <button 
                      onClick={() => setModel('V4_5PLUS')}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all ${model === 'V4_5PLUS' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      V4.5 Plus
                    </button>
                    <button 
                      onClick={() => setModel('V4_5ALL')}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all ${model === 'V4_5ALL' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      V4.5 All
                    </button>
                    <button 
                      onClick={() => setModel('V4_5')}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all ${model === 'V4_5' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                      V4.5
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Excluded Elements */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">제외할 요소</label>
              {!isAddingExcluded ? (
                <>
                  <div className="relative">
                    <select 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && val !== '제외 요소 선택...') {
                          if (!(excludedElements || []).find(g => g && g.label === val)) {
                            setExcludedElements([...(excludedElements || []), { id: Math.random().toString(), label: val }]);
                          }
                          e.target.value = '제외 요소 선택...';
                        }
                      }}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-[var(--accent-primary)]/50"
                    >
                      <option>제외 요소 선택...</option>
                      <option value="허밍 (humming)">허밍 (humming)</option>
                      <option value="긴 인트로 (long intro)">긴 인트로 (long intro)</option>
                      <option value="긴 아웃트로 (long outro)">긴 아웃트로 (long outro)</option>
                      <option value="박수 소리 (clapping)">박수 소리 (clapping)</option>
                      <option value="관중 소리 (crowd noise)">관중 소리 (crowd noise)</option>
                      <option value="나레이션 (narration)">나레이션 (narration)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                  </div>
                  <button 
                    onClick={() => setIsAddingExcluded(true)}
                    className="text-[11px] text-[var(--accent-text)] hover:opacity-80 transition-colors"
                  >
                    + 직접 추가
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <input 
                    autoFocus
                    value={excludedInput}
                    onChange={(e) => setExcludedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (excludedInput.trim()) {
                          setExcludedElements([...(excludedElements || []), { id: Math.random().toString(), label: excludedInput.trim() }]);
                          setExcludedInput('');
                          setIsAddingExcluded(false);
                        }
                      }
                    }}
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-primary)]/50"
                    placeholder="직접 입력..."
                  />
                  <button 
                    onClick={() => {
                      if (excludedInput.trim()) {
                        setExcludedElements([...excludedElements, { id: Math.random().toString(), label: excludedInput.trim() }]);
                        setExcludedInput('');
                        setIsAddingExcluded(false);
                      }
                    }}
                    className="px-3 py-1 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-xs font-bold"
                  >
                    추가
                  </button>
                  <button 
                    onClick={() => {
                      setExcludedInput('');
                      setIsAddingExcluded(false);
                    }}
                    className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg text-xs font-bold"
                  >
                    취소
                  </button>
                </div>
              )}

              {(excludedElements || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(excludedElements || []).map(tag => tag && (
                    <span key={tag.id} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg text-xs border border-[var(--border-color)]">
                      {tag.label}
                      <button onClick={() => removeTag(setExcludedElements, tag.id)}><X className="w-3 h-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Lyrics Length Setting */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                <Sliders className="w-4 h-4" />
                <span className="text-sm font-bold">가사 길이 설정</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">공백 포함 (자)</label>
                  <input 
                    type="number"
                    value={lyricsLengthWithSpaces}
                    onChange={(e) => setLyricsLengthWithSpaces(parseInt(e.target.value) || 0)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">공백 제외 (자)</label>
                  <input 
                    type="number"
                    value={lyricsLengthWithoutSpaces}
                    onChange={(e) => setLyricsLengthWithoutSpaces(parseInt(e.target.value) || 0)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]/50"
                  />
                </div>
              </div>
            </div>

            {/* Additional Request */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">추가 요청 사항</label>
              <textarea 
                value={additionalRequest}
                onChange={(e) => setAdditionalRequest(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]/50 transition-all outline-none min-h-[80px] resize-none"
                placeholder="예: 가사에 '사랑'이라는 단어를 꼭 넣어줘, 후렴구에 웅장한 코러스를 넣어줘 등"
              />
            </div>

            {/* Generation Count */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">생성 개수 (최대 20개)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range"
                  min="1"
                  max="20"
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                />
                <span className="text-sm font-bold text-[var(--text-primary)] w-8 text-center">{genCount}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <div className="pt-4 sticky bottom-0 bg-[var(--bg-primary)] pb-4 flex flex-col gap-2">
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl text-sm mb-2 border border-red-400/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-xl text-sm mb-2 border border-emerald-400/20">
            <Check className="w-4 h-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button 
            onClick={onReset}
            className="flex-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-4 flex items-center justify-center gap-2 text-sm font-bold text-[var(--text-primary)] transition-all active:scale-[0.98]"
          >
            <FolderOpen className="w-5 h-5 text-[var(--text-secondary)]" />
            설정 초기화
          </button>
          <button 
            onClick={handleGeneratePrompts}
            disabled={isGeneratingPrompt || isGenerating}
            className="flex-1 bg-[var(--text-primary)] hover:opacity-90 border border-[var(--border-color)] rounded-xl py-4 flex items-center justify-center gap-2 text-sm font-bold text-[var(--bg-primary)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isGeneratingPrompt ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-text)]" />
            ) : (
              <Sparkles className="w-5 h-5 text-[var(--accent-text)]" />
            )}
            {isGeneratingPrompt ? '프롬프트 생성 중...' : '프롬프트 생성'}
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isGeneratingPrompt}
            className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-xl py-4 flex items-center justify-center gap-2 text-sm font-bold text-[var(--text-on-accent)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-on-accent)]" />
            ) : (
              <Music className="w-5 h-5 text-[var(--text-on-accent)]" />
            )}
            {isGenerating ? '음악 생성 중...' : '음악 생성'}
          </button>
        </div>
        <a 
          href="https://kmong.com/self-marketing/730531/ZQh4nXZpK5" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-[#FFD400] hover:bg-[#F2C900] text-[#333333] rounded-xl py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.98] mt-2"
        >
          크몽 바로가기
        </a>
        <div className="text-center mt-4">
          <p className="text-[10px] text-[var(--text-secondary)]">
            © 2026 방구석 작곡가(5barTV). All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
