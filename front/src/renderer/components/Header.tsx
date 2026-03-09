import React, { useState } from 'react'
import type { FileData, Language } from '../types'

interface HeaderProps {
  currentFile: FileData | null
  isDirty: boolean
  currentLanguage: Language
  isRunning: boolean
  onNewFile: () => void
  onOpenFile: () => void
  onSaveFile: () => void
  onSaveAs: () => void
  onRunCode: () => void
  onLanguageChange: (lang: Language) => void
  onExit: () => void
  recents: FileData[]
  onSelectRecent: (file: FileData) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
  zoom: number
  onZoomChange: (zoom: number) => void
  isFullscreen: boolean
  onFullscreenToggle: () => void
}

export default function Header({
  currentFile,
  isDirty,
  currentLanguage,
  isRunning,
  onNewFile,
  onOpenFile,
  onSaveFile,
  onSaveAs,
  onRunCode,
  onLanguageChange,
  onExit,
  recents,
  onSelectRecent,
  fontSize,
  onFontSizeChange,
  theme,
  onThemeChange,
  zoom,
  onZoomChange,
  isFullscreen,
  onFullscreenToggle,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  const closeMenus = () => setOpenMenu(null)

  const languages: Array<{ id: Language; name: string; icon: string }> = [
    { id: 'py', name: 'Python', icon: '🐍' },
    { id: 'c', name: 'C', icon: '⚙️' },
    { id: 'js', name: 'JavaScript', icon: '🟨' },
  ]

  return (
    <div className="h-12 bg-ide-toolbar border-b border-ide-border flex items-center px-4 gap-6 flex-shrink-0 select-none">
      {/* FILE MENU */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('file')}
          className="px-3 py-2 text-ide-text hover:bg-ide-border rounded transition-colors text-sm font-medium"
        >
          File
        </button>
        {openMenu === 'file' && (
          <div className="absolute top-full left-0 bg-ide-surface border border-ide-border rounded shadow-lg min-w-56 z-50 mt-1">
            <button
              onClick={() => {
                onNewFile()
                closeMenus()
              }}
              className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors flex justify-between items-center"
            >
              <span>New File</span>
              <span className="text-xs text-ide-muted">Ctrl+N</span>
            </button>

            <button
              onClick={() => {
                onOpenFile()
                closeMenus()
              }}
              className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors flex justify-between items-center"
            >
              <span>Open File</span>
              <span className="text-xs text-ide-muted">Ctrl+O</span>
            </button>

            <div className="border-t border-ide-border my-1" />

            <button
              onClick={() => {
                onSaveFile()
                closeMenus()
              }}
              disabled={!currentFile || !isDirty}
              className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Save</span>
              <span className="text-xs text-ide-muted">Ctrl+S</span>
            </button>

            <button
              onClick={() => {
                onSaveAs()
                closeMenus()
              }}
              disabled={!currentFile}
              className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Save As...</span>
              <span className="text-xs text-ide-muted">Ctrl+Shift+S</span>
            </button>

            <div className="border-t border-ide-border my-1" />

            {/* RECENT FILES SUBMENU */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('recents')}
                className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors flex justify-between items-center"
              >
                <span>Recent Files</span>
                <span className="text-xs text-ide-muted">▶</span>
              </button>
              {openMenu === 'recents' && recents.length > 0 && (
                <div className="absolute left-full top-0 bg-ide-surface border border-ide-border rounded shadow-lg min-w-48 z-50 ml-2">
                  {recents.map((file) => (
                    <button
                      key={file.filepath}
                      onClick={() => {
                        onSelectRecent(file)
                        closeMenus()
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors truncate"
                      title={file.filepath}
                    >
                      {file.filename}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-ide-border my-1" />

            <button
              onClick={() => {
                onExit()
                closeMenus()
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-900/30 text-red-400 text-sm transition-colors"
            >
              Exit
            </button>
          </div>
        )}
      </div>

      {/* SETTINGS MENU */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('settings')}
          className="px-3 py-2 text-ide-text hover:bg-ide-border rounded transition-colors text-sm font-medium"
        >
          Settings
        </button>
        {openMenu === 'settings' && (
          <div className="absolute top-full left-0 bg-ide-surface border border-ide-border rounded shadow-lg min-w-56 z-50 mt-1">
            {/* Font Size */}
            <div className="px-4 py-3 border-b border-ide-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-ide-text">Font Size</span>
                <span className="text-xs text-ide-muted">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
                  className="px-2 py-1 text-xs bg-ide-border hover:bg-ide-accent hover:text-ide-bg rounded transition-colors"
                >
                  −
                </button>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                  className="px-2 py-1 text-xs bg-ide-border hover:bg-ide-accent hover:text-ide-bg rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="px-4 py-3 border-b border-ide-border">
              <span className="text-sm text-ide-text block mb-2">Theme</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onThemeChange('dark')
                    closeMenus()
                  }}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    theme === 'dark'
                      ? 'bg-ide-accent text-ide-bg'
                      : 'bg-ide-border hover:bg-ide-border text-ide-text'
                  }`}
                >
                  🌙 Dark
                </button>
                <button
                  onClick={() => {
                    onThemeChange('light')
                    closeMenus()
                  }}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    theme === 'light'
                      ? 'bg-ide-accent text-ide-bg'
                      : 'bg-ide-border hover:bg-ide-border text-ide-text'
                  }`}
                >
                  ☀️ Light
                </button>
              </div>
            </div>

            {/* Zoom */}
            <div className="px-4 py-3 border-b border-ide-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-ide-text">Zoom</span>
                <span className="text-xs text-ide-muted">{zoom}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onZoomChange(Math.max(80, zoom - 10))}
                  className="px-2 py-1 text-xs bg-ide-border hover:bg-ide-accent hover:text-ide-bg rounded transition-colors"
                >
                  −
                </button>
                <input
                  type="range"
                  min="80"
                  max="200"
                  value={zoom}
                  onChange={(e) => onZoomChange(parseInt(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => onZoomChange(Math.min(200, zoom + 10))}
                  className="px-2 py-1 text-xs bg-ide-border hover:bg-ide-accent hover:text-ide-bg rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fullscreen */}
            <button
              onClick={() => {
                onFullscreenToggle()
                closeMenus()
              }}
              className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors flex justify-between items-center"
            >
              <span>Fullscreen</span>
              <span className="text-xs text-ide-muted">{isFullscreen ? '✓' : ''}</span>
            </button>

            <div className="border-t border-ide-border my-1" />

            {/* Run */}
            <button
              onClick={() => {
                onRunCode()
                closeMenus()
              }}
              disabled={!currentFile || isRunning}
              className="w-full text-left px-4 py-2 hover:bg-ide-accent hover:text-ide-bg text-ide-text text-sm transition-colors flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isRunning ? '⏳ Running...' : '▶ Run'}</span>
              <span className="text-xs text-ide-muted">Ctrl+Enter</span>
            </button>
          </div>
        )}
      </div>

      {/* HELP MENU */}
      <div className="relative">
        <button
          onClick={() => toggleMenu('help')}
          className="px-3 py-2 text-ide-text hover:bg-ide-border rounded transition-colors text-sm font-medium"
        >
          Help
        </button>
        {openMenu === 'help' && (
          <div className="absolute top-full left-0 bg-ide-surface border border-ide-border rounded shadow-lg min-w-48 z-50 mt-1">
            <button className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors">
              Documentation
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors">
              Keyboard Shortcuts
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors">
              About
            </button>
          </div>
        )}
      </div>

      {/* SPACER */}
      <div className="flex-1" />

      {/* CURRENT FILE INFO */}
      {currentFile && (
        <div className="flex items-center gap-2 text-sm text-ide-muted">
          <span className="text-lg">
            {currentLanguage === 'py' ? '🐍' : currentLanguage === 'c' ? '⚙️' : '🟨'}
          </span>
          <span>{currentFile.filename}</span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-ide-accent" />}
        </div>
      )}

      {/* SPACER */}
      <div className="flex-1" />

      {/* LANGUAGE SELECTOR */}
      <div className="flex items-center gap-2 bg-ide-surface rounded border border-ide-border px-1">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onLanguageChange(lang.id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentLanguage === lang.id
                ? 'bg-ide-accent text-ide-bg'
                : 'hover:bg-ide-border text-ide-text'
            }`}
            title={lang.name}
          >
            {lang.icon}
          </button>
        ))}
      </div>

      {/* Click outside to close menus */}
      {openMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeMenus}
        />
      )}
    </div>
  )
}
