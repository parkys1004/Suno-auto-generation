import React from 'react';
import { Music, Settings, Sun, Moon, Download, Upload, BookOpen } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenManual: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onDownloadSettings: () => void;
  onUploadSettings: () => void;
}

export function Header({ onOpenSettings, onOpenManual, theme, toggleTheme, onDownloadSettings, onUploadSettings }: HeaderProps) {
  return (
    <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-4 sm:px-6 shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
          <Music className="w-6 h-6 text-[var(--text-on-accent)]" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight">Suno AI 음악 생성기</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenManual}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="사용 설명서"
        >
          <BookOpen className="w-5 h-5" />
        </button>
        <button 
          onClick={onDownloadSettings}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="설정 다운로드 (JSON)"
        >
          <Download className="w-5 h-5" />
        </button>
        <button 
          onClick={onUploadSettings}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="설정 업로드 (JSON)"
        >
          <Upload className="w-5 h-5" />
        </button>
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <button onClick={onOpenSettings} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><Settings className="w-5 h-5" /></button>
      </div>
    </header>
  );
}
