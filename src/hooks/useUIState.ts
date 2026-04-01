import { useState, useEffect, useRef } from 'react';

export const useUIState = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
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
  const libraryScrollRef = useRef<HTMLDivElement>(null);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (libraryScrollRef.current) {
        setShowScrollTop(libraryScrollRef.current.scrollTop > 300);
      }
    };

    const scrollContainer = libraryScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    libraryScrollRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const [libraryTab, setLibraryTab] = useState<'music' | 'prompts'>('music');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editPromptData, setEditPromptData] = useState({ title: '', style_prompt: '', lyrics: '' });
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'complete' | 'favorite'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  return {
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
    sortBy, setSortBy
  };
};
