'use client';

import React, { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '@/store/useEditorStore';

interface CodeEditorProps {
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ height = '100%' }) => {
  const { language, code, setCode, autosave } = useEditorStore();

  // Periodic silent background autosave
  useEffect(() => {
    const timer = setInterval(() => {
      autosave();
    }, 5000);
    return () => clearInterval(timer);
  }, [autosave]);

  return (
    <div className="w-full h-full bg-[#1e1e1e]">
      <Editor
        height={height}
        language={language === 'cpp' ? 'cpp' : language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || '')}
        options={{
          fontSize: 14,
          fontFamily: 'var(--font-jetbrains), "JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          lineNumbersMinChars: 3,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          renderLineHighlight: 'line',
          renderWhitespace: 'none',
          wordWrap: 'off',
          tabSize: 4,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            verticalSliderSize: 8,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <div className="flex items-center gap-3 text-zinc-500 text-xs font-mono">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading editor...
            </div>
          </div>
        }
      />
    </div>
  );
};
