import { create } from 'zustand';
import { LANGUAGE_STARTERS } from '@/lib/constants';

interface EditorState {
  language: string;
  code: string;
  lastSavedAt: string | null;
  codeByLanguage: Record<string, string>; // Store code for each language
  setLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  resetCode: () => void;
  autosave: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  language: 'javascript',
  code: LANGUAGE_STARTERS['javascript'],
  lastSavedAt: null,
  codeByLanguage: {
    javascript: LANGUAGE_STARTERS['javascript'],
    cpp: LANGUAGE_STARTERS['cpp'],
    python: LANGUAGE_STARTERS['python'],
    java: LANGUAGE_STARTERS['java'],
  },
  setLanguage: (lang: string) => {
    const state = get();
    // Get saved code for this language, or use template if never edited
    const savedCode = state.codeByLanguage[lang];
    set({ 
      language: lang, 
      code: savedCode || LANGUAGE_STARTERS[lang] || '',
    });
  },
  setCode: (code: string) => {
    const currentLang = get().language;
    // Save code to codeByLanguage for current language
    set({ 
      code,
      codeByLanguage: {
        ...get().codeByLanguage,
        [currentLang]: code,
      },
    });
  },
  resetCode: () => {
    const lang = get().language;
    const template = LANGUAGE_STARTERS[lang] || '// Write solution here';
    set({ 
      code: template,
      codeByLanguage: {
        ...get().codeByLanguage,
        [lang]: template,
      },
    });
  },
  autosave: () => {
    set({ lastSavedAt: new Date().toLocaleTimeString() });
  },
}));
