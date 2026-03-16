import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

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
  baseUrl
}: SettingsModalProps) {
  const [geminiTestStatus, setGeminiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [chatgptTestStatus, setChatgptTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [sunoTestStatus, setSunoTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

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
    try {
      const response = await axios.get(`/api/suno/status/test?baseUrl=${encodeURIComponent(baseUrl)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (response.data?.success) {
        setSunoTestStatus('success');
      } else {
        setSunoTestStatus('error');
      }
    } catch (e: any) {
      setSunoTestStatus('error');
    }
  };

  return (
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
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/20">
              <button 
                onClick={() => {
                  setGeminiApiKey('');
                  setChatgptApiKey('');
                  setApiKey('');
                  setGeminiTestStatus('idle');
                  setChatgptTestStatus('idle');
                  setSunoTestStatus('idle');
                }}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                모두 지우기
              </button>
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
  );
}
