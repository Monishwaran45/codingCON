'use client';

import React, { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '@/store/useEditorStore';

interface CodeEditorProps {
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ height = 'calc(100vh - 360px)' }) => {
  const { language, code, setCode, autosave } = useEditorStore();

  // Periodic silent background autosave
  useEffect(() => {
    const timer = setInterval(() => {
      autosave();
    }, 5000);
    return () => clearInterval(timer);
  }, [autosave]);

  return (
    <div className="w-full bg-[#0d131f] border-b border-slate-800">
      <Editor
        height={height}
        language={language === 'cpp' ? 'cpp' : language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || '')}
        options={{
          fontSize: 13,
          fontFamily: 'var(--font-jetbrains), Fira Code, monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          lineNumbersMinChars: 3,
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
    </div>
  );
};
