import React, { lazy, Suspense } from 'react'
import type { FileData, Language } from '../types'

const Editor = lazy(() => import('@monaco-editor/react'))

const MONACO_LANGUAGES: Record<Language, string> = {
  py: 'python',
  c: 'c',
  js: 'javascript',
}

interface CodeEditorProps {
  file: FileData
  language: Language
  onChange: (content: string) => void
}

export default function CodeEditor({ file, language, onChange }: CodeEditorProps) {
  return (
    <div className="h-full w-full bg-ide-bg">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-ide-surface">
            <div className="text-ide-muted">Loading editor...</div>
          </div>
        }
      >
        <Editor
          height="100%"
          language={MONACO_LANGUAGES[language]}
          value={file.content}
          onChange={(value) => onChange(value || '')}
          theme="vs-dark"
          options={{
            fontFamily: '"Fira Code", Consolas, monospace',
            fontSize: 14,
            fontLigatures: true,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            automaticLayout: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            bracketPairColorization: {
              enabled: true,
            },
            'bracketPairColorization.independentColorPoolPerBracketType': true,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </Suspense>
    </div>
  )
}
