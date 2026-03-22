import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Key, Sparkles, Music, Sliders } from 'lucide-react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualModal({ isOpen, onClose }: ManualModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-lg font-bold">사용 설명서</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              <section className="space-y-3">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Key className="w-4 h-4 text-[var(--accent-primary)]" />
                  1. API 키 설정
                </h3>
                <div className="text-sm text-[var(--text-secondary)] space-y-2 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                  <p>• 우측 상단의 <strong>톱니바퀴(설정)</strong> 버튼을 눌러 API 키를 입력해야 합니다.</p>
                  <p>• <strong>프롬프트 생성 모델:</strong> ChatGPT 또는 Gemini 중 선택하고 해당 API 키를 입력하세요.</p>
                  <p>• <strong>Suno API Key:</strong> 음악 생성을 위해 Suno API 키를 입력하고 테스트 버튼으로 확인하세요.</p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  2. 프롬프트 생성
                </h3>
                <div className="text-sm text-[var(--text-secondary)] space-y-2 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                  <p>• <strong>음악 설명:</strong> 만들고 싶은 음악의 분위기나 주제를 자유롭게 입력하세요.</p>
                  <p>• <strong>AI 자동 설정:</strong> 설명을 입력한 후 이 버튼을 누르면 AI가 어울리는 장르, 무드, 악기 등을 자동으로 설정해 줍니다.</p>
                  <p>• 하단의 <strong>'프롬프트 생성'</strong> 버튼을 누르면 AI가 가사와 음악 스타일(프롬프트)을 작성합니다.</p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
                  3. 고급 설정
                </h3>
                <div className="text-sm text-[var(--text-secondary)] space-y-2 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                  <p>• <strong>장르 및 세부 장르:</strong> 원하는 음악 장르를 선택하거나 직접 추가할 수 있습니다.</p>
                  <p>• <strong>보컬/인스트루멘탈:</strong> 가사가 있는 노래(보컬) 또는 연주곡(인스트루멘탈)을 선택합니다.</p>
                  <p>• <strong>템포(BPM):</strong> 곡의 빠르기를 조절합니다.</p>
                  <p>• <strong>언어 설정:</strong> 가사의 주 언어와 보조 언어(비중 포함)를 설정할 수 있습니다.</p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Music className="w-4 h-4 text-[var(--accent-primary)]" />
                  4. 음악 생성 및 관리
                </h3>
                <div className="text-sm text-[var(--text-secondary)] space-y-2 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
                  <p>• 프롬프트가 준비되면 <strong>'음악 생성'</strong> 버튼을 눌러 Suno AI에 작곡을 요청합니다.</p>
                  <p>• 생성된 곡은 우측 목록에 나타나며, 재생, 가사 보기, MP3/MP4 다운로드가 가능합니다.</p>
                  <p>• <strong>대량 다운로드:</strong> 여러 곡을 선택하여 한 번에 ZIP 파일로 다운로드할 수 있습니다.</p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
