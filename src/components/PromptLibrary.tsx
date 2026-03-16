import React, { useState } from 'react';
import { Sparkles, Save, Edit2, Trash2, Music, Check, X, Calendar, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { GeneratedPrompt } from '../types';

interface PromptLibraryProps {
  prompts: GeneratedPrompt[];
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'title';
  editingPromptId: string | null;
  setEditingPromptId: (id: string | null) => void;
  editPromptData: { title: string; style_prompt: string; lyrics: string };
  setEditPromptData: (data: { title: string; style_prompt: string; lyrics: string }) => void;
  handleSavePrompt: (id: string) => void;
  handleDeletePrompt: (id: string) => void;
  handleCopyPrompt: (text: string) => void;
  handleGenerateFromPrompt: (prompt: GeneratedPrompt) => void;
  selectedPrompts: Set<string>;
  togglePromptSelection: (id: string) => void;
  isGenerating: boolean;
}

export function PromptLibrary({
  prompts,
  searchQuery,
  sortBy,
  editingPromptId,
  setEditingPromptId,
  editPromptData,
  setEditPromptData,
  handleSavePrompt,
  handleDeletePrompt,
  handleCopyPrompt,
  handleGenerateFromPrompt,
  selectedPrompts,
  togglePromptSelection,
  isGenerating
}: PromptLibraryProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedLyricsIds, setExpandedLyricsIds] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleLyricsExpand = (id: string) => {
    setExpandedLyricsIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const filteredPrompts = prompts.filter(p => {
    const title = p.title || '';
    const lyrics = p.lyrics || '';
    const style_prompt = p.style_prompt || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           lyrics.toLowerCase().includes(searchQuery.toLowerCase()) ||
           style_prompt.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  const groupedPrompts = sortedPrompts.reduce((acc, prompt) => {
    const date = new Date(prompt.created_at);
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
    acc[group].push(prompt);
    return acc;
  }, {} as Record<string, GeneratedPrompt[]>);

  const groups = ['오늘', '어제', '최근 7일', '이전'];

  if (filteredPrompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
        <p>생성된 프롬프트가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(group => {
        const groupPrompts = groupedPrompts[group];
        if (!groupPrompts || groupPrompts.length === 0) return null;

        const isCollapsed = collapsedGroups[group];

        return (
          <div key={group} className="space-y-4">
            <button 
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between group/header"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] group-hover/header:text-[var(--accent-primary)] transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{group}</h3>
                <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                  {groupPrompts.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[10px] font-medium opacity-0 group-hover/header:opacity-100 transition-opacity">
                  {isCollapsed ? '펼치기' : '접기'}
                </span>
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {!isCollapsed && (
              <div className="space-y-6">
                {groupPrompts.map(prompt => {
                  const isNew = new Date().getTime() - new Date(prompt.created_at).getTime() < 1000 * 60 * 60;
                  return (
                    <div key={prompt.id} className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4 hover:border-[var(--accent-primary)]/30 transition-colors group">
                      {editingPromptId === prompt.id ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">프롬프트 편집</h3>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleSavePrompt(prompt.id)}
                                className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-xs font-bold text-[var(--text-on-accent)] transition-colors flex items-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                저장
                              </button>
                              <button 
                                onClick={() => setEditingPromptId(null)}
                                className="px-3 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                취소
                              </button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">제목</label>
                              <input 
                                value={editPromptData.title}
                                onChange={(e) => setEditPromptData({ ...editPromptData, title: e.target.value })}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)]"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">스타일 프롬프트</label>
                              <textarea 
                                value={editPromptData.style_prompt}
                                onChange={(e) => setEditPromptData({ ...editPromptData, style_prompt: e.target.value })}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)] h-20 resize-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">가사</label>
                              <textarea 
                                value={editPromptData.lyrics}
                                onChange={(e) => setEditPromptData({ ...editPromptData, lyrics: e.target.value })}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)] h-40 resize-none custom-scrollbar"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => togglePromptSelection(prompt.id)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedPrompts.has(prompt.id) ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'}`}
                              >
                                {selectedPrompts.has(prompt.id) && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <div>
                                <h4 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                  {prompt.title}
                                  {isNew && <span className="px-1.5 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-text)] text-[9px] font-bold rounded uppercase tracking-wider">NEW</span>}
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)]">{new Date(prompt.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleGenerateFromPrompt(prompt)}
                                disabled={isGenerating}
                                className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg text-xs font-bold text-[var(--text-on-accent)] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <Music className="w-3.5 h-3.5" />
                                음악 생성
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingPromptId(prompt.id);
                                  setEditPromptData({ title: prompt.title, style_prompt: prompt.style_prompt, lyrics: prompt.lyrics });
                                }}
                                className="p-2 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                title="편집"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeletePrompt(prompt.id)}
                                className="p-2 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">스타일 프롬프트</label>
                                <button onClick={() => handleCopyPrompt(prompt.style_prompt)} className="p-1 hover:bg-[var(--bg-primary)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-mono leading-relaxed">
                                {prompt.style_prompt}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">가사</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                    {expandedLyricsIds.has(prompt.id) ? '클릭하여 접기' : '클릭하여 펼치기'}
                                  </span>
                                  <button onClick={(e) => { e.stopPropagation(); handleCopyPrompt(prompt.lyrics); }} className="p-1 hover:bg-[var(--bg-primary)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div 
                                onClick={() => toggleLyricsExpand(prompt.id)}
                                className={`p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-primary)] leading-relaxed transition-all duration-300 whitespace-pre-wrap cursor-pointer hover:border-[var(--accent-primary)]/50 ${
                                  expandedLyricsIds.has(prompt.id) 
                                    ? 'min-h-[96px] h-auto' 
                                    : 'h-24 overflow-y-auto custom-scrollbar'
                                }`}
                              >
                                {prompt.lyrics}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
