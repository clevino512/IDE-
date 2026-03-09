import React, { useState, useEffect } from 'react'
import type { Language } from '../types'

interface NewFileModalProps {
  onCreate: (filename: string, language: Language) => void
  onClose: () => void
}

export default function NewFileModal({ onCreate, onClose }: NewFileModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('js')
  const [filename, setFilename] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && filename.trim()) {
        handleCreate()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filename, selectedLanguage, onClose])

  const handleCreate = () => {
    if (filename.trim()) {
      onCreate(filename.trim(), selectedLanguage)
      setFilename('')
    }
  }

  const languages: Array<{ id: Language; name: string; icon: string }> = [
    { id: 'py', name: 'Python', icon: '🐍' },
    { id: 'c', name: 'C', icon: '⚙️' },
    { id: 'js', name: 'JavaScript', icon: '🟨' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-ide-surface border border-ide-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6 modal">
        <h2 className="text-lg font-semibold text-ide-text mb-6">Create New File</h2>

        <div className="mb-6">
          <p className="text-xs text-ide-muted mb-3">Select Language</p>
          <div className="grid grid-cols-3 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className={`p-3 rounded border-2 transition-all ${
                  selectedLanguage === lang.id
                    ? 'border-ide-accent bg-ide-accent bg-opacity-10'
                    : 'border-ide-border hover:border-ide-accent bg-ide-bg'
                }`}
              >
                <div className="text-2xl mb-1">{lang.icon}</div>
                <div className="text-xs font-medium text-ide-text">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs text-ide-muted mb-2 block">Filename</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Enter filename (without extension)"
            autoFocus
            className="w-full px-3 py-2 bg-ide-bg border border-ide-border rounded text-ide-text text-sm focus:outline-none focus:border-ide-accent transition-colors"
          />
          <p className="text-xs text-ide-muted mt-1">
            Extension will be added automatically (.{selectedLanguage})
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ide-surface border border-ide-border hover:bg-ide-border text-ide-text text-sm rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!filename.trim()}
            className="px-4 py-2 bg-ide-accent hover:opacity-90 text-ide-bg text-sm rounded font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
