import React from 'react';
import { Tag } from '../types';

export const sanitizeKey = (key: string | null) => {
  if (!key) return '';
  let sanitized = key.trim();
  if (sanitized.toLowerCase().startsWith('bearer ')) {
    sanitized = sanitized.slice(7).trim();
  }
  return sanitized;
};

export const safeString = (val: any, fallback: string = ''): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val === null || val === undefined) return fallback;
  
  if (typeof val === 'object') {
    if (typeof val.label === 'string') return val.label;
    if (typeof val.name === 'string') return val.name;
    if (typeof val.text === 'string') return val.text;
    if (typeof val.value === 'string') return val.value;
    
    if (val.label) return safeString(val.label, fallback);
    if (val.name) return safeString(val.name, fallback);
    if (val.text) return safeString(val.text, fallback);
    if (val.value) return safeString(val.value, fallback);
  }
  
  try {
    const stringified = JSON.stringify(val);
    return stringified === '{}' ? fallback : stringified;
  } catch (e) {
    return fallback;
  }
};

export const sanitizeTag = (val: any, maxLen: number = 30): string => {
  const str = safeString(val).trim();
  if (str.length > maxLen) {
    return str.substring(0, maxLen) + '...';
  }
  return str;
};

export const extractJSON = (text: string) => {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // Try to find JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw new Error('Could not parse JSON from text');
      }
    }
    throw new Error('No JSON found in text');
  }
};

export const removeTag = (setFn: React.Dispatch<React.SetStateAction<Tag[]>>, id: string) => {
  setFn(prev => (prev || []).filter(t => t && t.id !== id));
};
