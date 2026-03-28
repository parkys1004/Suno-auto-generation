import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        >
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          </div>
          <p className="text-[var(--text-secondary)] mb-6 text-sm leading-relaxed">
            {message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors text-sm font-bold"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-bold"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
