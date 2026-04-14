import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, X } from 'lucide-react';

interface ToastNotificationProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
  duration?: number;
}

export function ToastNotification({ message, type, onClose, duration = 5000 }: ToastNotificationProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.8, x: '-50%' }}
        animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
        exit={{ opacity: 0, y: -20, scale: 0.8, x: '-50%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-8 left-1/2 z-[200] w-[calc(100%-2rem)] max-w-md pointer-events-none"
      >
        <div className={`
          pointer-events-auto
          relative flex items-center gap-3 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border backdrop-blur-xl
          ${type === 'error' 
            ? 'bg-red-500/95 border-red-400/50 text-white' 
            : 'bg-emerald-500/95 border-emerald-400/50 text-white'}
        `}>
          {/* Speech bubble tail (pointing up to the top) */}
          <div className={`
            absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t
            ${type === 'error' ? 'bg-red-500/95 border-red-400/50' : 'bg-emerald-500/95 border-emerald-400/50'}
          `} />

          <div className="shrink-0 bg-white/20 p-1.5 rounded-lg">
            {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight break-words">
              {message}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
