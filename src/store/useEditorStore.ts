import { create } from 'zustand';
import { LANGUAGE_STARTERS } from '@/lib/constants';

interface EditorState {
  language: string;
  code: string;
  lastSavedAt: string | null;
  setLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  resetCode: () => void;
  autosave: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  language: 'javascript',
  code: LANGUAGE_STARTERS['javascript'],
  lastSavedAt: null,
  setLanguage: (lang: string) => {
    const starter = LANGUAGE_STARTERS[lang] || '// Write solution here';
    set({ language: lang, code: starter });
  },
  setCode: (code: string) => {
    set({ code });
  },
  resetCode: () => {
    const lang = get().language;
    set({ code: LANGUAGE_STARTERS[lang] || '// Write solution here' });
  },
  autosave: () => {
    set({ lastSavedAt: new Date().toLocaleTimeString() });
  },
}));
