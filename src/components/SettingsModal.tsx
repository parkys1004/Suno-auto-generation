import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { ConfirmModal } from './ConfirmModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptModel: 'chatgpt' | 'gemini';
  setPromptModel: (model: 'chatgpt' | 'gemini') => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  chatgptApiKey: string;
  setChatgptApiKey: (key: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  generatedHistoryCount: number;
  onClearHistory: () => void;
  onResetAll: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  promptModel,
  setPromptModel,
  geminiApiKey,
  setGeminiApiKey,
  chatgptApiKey,
  setChatgptApiKey,
  apiKey,
  setApiKey,
  baseUrl,
  setBaseUrl,
  generatedHistoryCount,
  onClearHistory,
  onResetAll
}: SettingsModalProps) {
  const [geminiTestStatus, setGeminiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [chatgptTestStatus, setChatgptTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [sunoTestStatus, setSunoTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [sunoError, setSunoError] = useState<string>('');
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const testGeminiKey = async () => {
    if (!geminiApiKey) return;
    setGeminiTestStatus('testing');
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'hi'
      });
      setGeminiTestStatus('success');
    } catch (e) {
      setGeminiTestStatus('error');
    }
  };

  const testChatgptKey = async () => {
    if (!chatgptApiKey) return;
    setChatgptTestStatus('testing');
    try {
      await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${chatgptApiKey}` }
      });
      setChatgptTestStatus('success');
    } catch (e) {
      setChatgptTestStatus('error');
    }
  };

  const testSunoKey = async () => {
    if (!apiKey) return;
    setSunoTestStatus('testing');
    setSunoError('');
    try {
      const response = await axios.get(`/api/suno/status/test?baseUrl=${encodeURIComponent(baseUrl)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (response.data?.success) {
        setSunoTestStatus('success');
      } else {
        setSunoTestStatus('error');
        setSunoError(response.data?.error || response.data?.message || 'API 키가 올바르지 않거나 서버 응답이 없습니다. Cloudflare 프록시 사용 시 Base URL을 확인해주세요.');
      }
    } catch (e: any) {
      setSunoTestStatus('error');
      const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message || '테스트 중 오류가 발생했습니다.';
      setSunoError(errorMsg + ' (Base URL이 올바른지 확인해주세요)');
    }
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">API 설정</h2>
              <button 
                onClick={onClose}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Model Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[var(--text-secondary)]">프롬프트 생성 모델 선택</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPromptModel('chatgpt')}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      promptModel === 'chatgpt' 
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' 
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    ChatGPT (GPT-5-nano)
                  </button>
                  <button
                    onClick={() => setPromptModel('gemini')}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      promptModel === 'gemini' 
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' 
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    Gemini (2.5 Flash)
                  </button>
                </div>
              </div>

              {/* Gemini/ChatGPT API Key */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <label className="text-sm font-bold text-[var(--text-primary)]">
                    {promptModel === 'gemini' ? 'Gemini API Key' : 'ChatGPT API Key'}
                  </label>
                  <span className="text-xs text-[var(--text-secondary)]">
                    ({promptModel === 'gemini' ? 'Gemini 2.5 Flash' : 'GPT-5-nano'})
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={promptModel === 'gemini' ? geminiApiKey : chatgptApiKey}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      if (val.toLowerCase().startsWith('bearer ')) {
                        val = val.slice(7).trim();
                      }
                      if (promptModel === 'gemini') {
                        setGeminiApiKey(val);
                        setGeminiTestStatus('idle');
                      } else {
                        setChatgptApiKey(val);
                        setChatgptTestStatus('idle');
                      }
                    }}
                    placeholder="••••••••••••••••••••••••••••••••••••"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-4 pr-20 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-colors placeholder:text-[var(--text-secondary)] opacity-70"
                  />
                  <button 
                    onClick={promptModel === 'gemini' ? testGeminiKey : testChatgptKey}
                    disabled={(promptModel === 'gemini' ? geminiTestStatus : chatgptTestStatus) === 'testing'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[52px] border border-[var(--border-color)]"
                  >
                    {(promptModel === 'gemini' ? geminiTestStatus : chatgptTestStatus) === 'testing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '테스트'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <a 
                    href={promptModel === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://platform.openai.com/api-keys'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    API 키 발급받기
                  </a>
                  {(promptModel === 'gemini' ? geminiTestStatus : chatgptTestStatus) === 'success' && (
                    <span className="text-xs font-medium text-[var(--accent-text)] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 사용 가능</span>
                  )}
                  {(promptModel === 'gemini' ? geminiTestStatus : chatgptTestStatus) === 'error' && (
                    <span className="text-xs font-medium text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> 사용 불가</span>
                  )}
                </div>
              </div>

              {/* Suno API Key */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-[var(--text-primary)]">Suno API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      if (val.toLowerCase().startsWith('bearer ')) {
                        val = val.slice(7).trim();
                      }
                      setApiKey(val);
                      setSunoTestStatus('idle');
                      setSunoError('');
                    }}
                    placeholder="••••••••••••••••••••••••••••••••••••"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-4 pr-20 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-colors placeholder:text-[var(--text-secondary)] opacity-70"
                  />
                  <button 
                    onClick={testSunoKey}
                    disabled={sunoTestStatus === 'testing'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[52px] border border-[var(--border-color)]"
                  >
                    {sunoTestStatus === 'testing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '테스트'}
                  </button>
                </div>

                {/* Suno Base URL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Base URL (선택 사항)</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => {
                      setBaseUrl(e.target.value.trim());
                      setSunoTestStatus('idle');
                      setSunoError('');
                    }}
                    placeholder="https://api.sunoapi.org/api/v1"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-colors placeholder:text-[var(--text-secondary)] opacity-70"
                  />
                  <p className="text-[9px] text-[var(--text-secondary)]">기본값: https://api.sunoapi.org/api/v1 (Cloudflare 프록시 사용 시 변경)</p>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <a 
                      href="https://sunoapi.org/ko/api-key" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      API 키 발급받기
                    </a>
                    {sunoTestStatus === 'success' && (
                      <span className="text-xs font-medium text-[var(--accent-text)] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 사용 가능</span>
                    )}
                    {sunoTestStatus === 'error' && (
                      <span className="text-xs font-medium text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> 사용 불가</span>
                    )}
                  </div>
                  {sunoError && (
                    <p className="text-[10px] text-red-400/80 bg-red-400/5 p-2 rounded-lg border border-red-400/10 mt-1">
                      {sunoError}
                    </p>
                  )}
                </div>
              </div>

              {/* Generation History Management */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-[var(--text-primary)]">생성 기록 관리</label>
                    <p className="text-[10px] text-[var(--text-secondary)]">중복 생성을 방지하기 위해 저장된 기록입니다.</p>
                  </div>
                  <span className="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[10px] font-bold rounded-md border border-[var(--border-color)]">
                    {generatedHistoryCount}개 저장됨
                  </span>
                </div>
                <button
                  onClick={() => {
                    requestConfirm('생성 기록 삭제', '모든 생성 기록을 삭제하시겠습니까? 중복 방지 기능이 초기화됩니다.', () => {
                      onClearHistory();
                    });
                  }}
                  disabled={generatedHistoryCount === 0}
                  className="w-full py-2.5 px-4 bg-red-400/10 hover:bg-red-400/20 text-red-400 text-xs font-bold rounded-xl border border-red-400/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  생성 기록 모두 삭제
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/20">
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setGeminiApiKey('');
                    setChatgptApiKey('');
                    setApiKey('');
                    setGeminiTestStatus('idle');
                    setChatgptTestStatus('idle');
                    setSunoTestStatus('idle');
                  }}
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  모두 지우기
                </button>
                <button 
                  onClick={onResetAll}
                  className="text-xs font-medium text-red-400 hover:text-red-500 transition-colors"
                >
                  전체 초기화
                </button>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                저장
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    <ConfirmModal
      isOpen={confirmConfig.isOpen}
      title={confirmConfig.title}
      message={confirmConfig.message}
      onConfirm={confirmConfig.onConfirm}
      onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
    />
    </>
  );
}
