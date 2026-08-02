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
    const currentLang = get().language;
    const currentCode = get().code;
    const oldStarter = LANGUAGE_STARTERS[currentLang];
    const newStarter = LANGUAGE_STARTERS[lang] || '';

    if (!currentCode || currentCode === oldStarter) {
      set({ language: lang, code: newStarter });
    } else {
      set({ language: lang });
    }
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
