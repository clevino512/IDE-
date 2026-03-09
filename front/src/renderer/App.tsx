import React, { useState, useCallback, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CodeEditor from './components/CodeEditor'
import Terminal from './components/Terminal'
import NewFileModal from './components/NewFileModal'
import type { FileData, Language, ExecutionResult, TerminalLine } from './types'

const TEMPLATES: Record<Language, string> = {
  py: '# Python Script\nprint("Hello, World!")\n',
  c: '#include <stdio.h>\nint main() { printf("Hello!\\n"); return 0; }\n',
  js: '// JavaScript\nconsole.log("Hello, World!");\n',
}

export default function App() {
  const [currentFile, setCurrentFile] = useState<FileData | null>(null)
  const [openFiles, setOpenFiles] = useState<FileData[]>([])
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set())
  const [currentLanguage, setCurrentLanguage] = useState<Language>('js')
  const [terminalHeight, setTerminalHeight] = useState(200)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [recents, setRecents] = useState<FileData[]>([])
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ✅ Vérifier que electronAPI est disponible
  useEffect(() => {
    if (!window.electronAPI) {
      console.error('❌ window.electronAPI is NOT available! Preload failed to load.')
      console.log('Available on window:', Object.keys(window))
    } else {
      console.log('✅ window.electronAPI is available')
    }
  }, [])

  // ✅ Apply zoom and font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${(fontSize / 16) * 100}%`
    document.documentElement.style.zoom = `${zoom}%`
  }, [fontSize, zoom])

  const isDirtyFile = useCallback((filepath: string) => {
    return dirtyFiles.has(filepath)
  }, [dirtyFiles])

  const setFileAsDirty = useCallback((filepath: string, dirty: boolean) => {
    setDirtyFiles((prev) => {
      const next = new Set(prev)
      if (dirty) {
        next.add(filepath)
      } else {
        next.delete(filepath)
      }
      return next
    })
  }, [])

  const addTerminalLine = useCallback((content: string, type: 'output' | 'error' | 'info' | 'success' = 'output') => {
    const now = new Date()
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    setTerminalLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp,
        content,
        type,
      },
    ])
  }, [])

  const clearTerminal = useCallback(() => {
    setTerminalLines([])
  }, [])

  const loadRecents = useCallback(async () => {
    try {
      const files = await window.electronAPI.file.recents()
      setRecents(files)
    } catch (err) {
      console.error('Failed to load recents:', err)
    }
  }, [])

  useEffect(() => {
    loadRecents()
  }, [loadRecents])

  const handleNewFile = useCallback(() => {
    setShowNewFileModal(true)
  }, [])

  const handleOpenFile = useCallback(async () => {
    try {
      const file = await window.electronAPI.file.open()
      if (file) {
        setCurrentFile(file)
        setCurrentLanguage(file.language as Language)
        setFileAsDirty(file.filepath, false)
        
        // ✅ Ajouter à openFiles si pas déjà ouvert
        setOpenFiles((prev) => {
          const exists = prev.some((f) => f.filepath === file.filepath)
          return exists ? prev : [...prev, file]
        })
        
        addTerminalLine(`Opened: ${file.filename}`, 'info')
        loadRecents()
      }
    } catch (err) {
      addTerminalLine(`Error opening file: ${(err as Error).message}`, 'error')
    }
  }, [addTerminalLine, loadRecents, setFileAsDirty])

  const handleSaveFile = useCallback(async () => {
    if (!currentFile) return

    try {
      await window.electronAPI.file.save({
        filepath: currentFile.filepath,
        content: currentFile.content,
        language: currentFile.language,
      })
      setFileAsDirty(currentFile.filepath, false)
      addTerminalLine(`Saved: ${currentFile.filename}`, 'success')
    } catch (err) {
      addTerminalLine(`Error saving file: ${(err as Error).message}`, 'error')
    }
  }, [currentFile, addTerminalLine, setFileAsDirty])

  const handleSaveAs = useCallback(async () => {
    if (!currentFile) return

    try {
      const newPath = await window.electronAPI.file.saveDialog()
      if (newPath) {
        await window.electronAPI.file.save({
          filepath: newPath,
          content: currentFile.content,
          language: currentFile.language,
        })
        
        const updatedFile = { ...currentFile, filepath: newPath }
        setCurrentFile(updatedFile)
        setFileAsDirty(newPath, false)
        setFileAsDirty(currentFile.filepath, false)
        
        // ✅ Mettre à jour dans openFiles
        setOpenFiles((prev) =>
          prev.map((f) => (f.filepath === currentFile.filepath ? updatedFile : f))
        )
        
        addTerminalLine(`Saved as: ${newPath}`, 'success')
        loadRecents()
      }
    } catch (err) {
      addTerminalLine(`Error saving file: ${(err as Error).message}`, 'error')
    }
  }, [currentFile, addTerminalLine, loadRecents, setFileAsDirty])

  const handleExit = useCallback(() => {
    const hasUnsaved = Array.from(dirtyFiles).length > 0
    if (hasUnsaved) {
      const confirmed = window.confirm('You have unsaved changes. Do you want to exit?')
      if (!confirmed) return
    }
    window.close()
  }, [dirtyFiles])

  const handleRunCode = useCallback(async () => {
    if (!currentFile) return

    setIsRunning(true)
    addTerminalLine(`Running ${currentFile.language.toUpperCase()}...`, 'info')

    try {
      const result = await window.electronAPI.code.run({
        code: currentFile.content,
        language: currentFile.language,
        fileId: currentFile._id,
      })

      if (result.output) {
        result.output
          .split('\n')
          .filter((line: string) => line.trim())
          .forEach((line: string) => addTerminalLine(line, 'output'))
      }

      if (result.error) {
        result.error
          .split('\n')
          .filter((line: string) => line.trim())
          .forEach((line: string) => addTerminalLine(line, 'error'))
      }

      addTerminalLine(`Completed in ${result.duration}ms`, 'info')
    } catch (err) {
      addTerminalLine(`Error running code: ${(err as Error).message}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }, [currentFile, addTerminalLine])

  const handleLanguageChange = useCallback((lang: Language) => {
    setCurrentLanguage(lang)
  }, [])

  const handleContentChange = useCallback((content: string) => {
    if (currentFile) {
      setCurrentFile({ ...currentFile, content })
      setFileAsDirty(currentFile.filepath, true)
    }
  }, [currentFile, setFileAsDirty])

  const handleCloseFile = useCallback((filepath: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.filepath !== filepath))
    setFileAsDirty(filepath, false)
    
    if (currentFile?.filepath === filepath) {
      setCurrentFile(null)
    }
  }, [currentFile, setFileAsDirty])

  const handleDeleteFile = useCallback((filepath: string) => {
    try {
      // Remove from open files
      handleCloseFile(filepath)
      addTerminalLine(`Deleted: ${filepath}`, 'info')
    } catch (err) {
      addTerminalLine(`Error deleting file: ${(err as Error).message}`, 'error')
    }
  }, [handleCloseFile, addTerminalLine])

  const handleCreateFile = useCallback(
    async (filename: string, language: Language) => {
      try {
        const ext = language === 'py' ? '.py' : language === 'c' ? '.c' : '.js'
        const tmpDir = await window.electronAPI.tmpdir()
        const filepath = `${tmpDir}/${filename}${ext}`

        const file = await window.electronAPI.file.create({
          filename,
          language,
          filepath,
        })

        setCurrentFile(file)
        setCurrentLanguage(language)
        setFileAsDirty(file.filepath, false)
        setShowNewFileModal(false)
        
        // ✅ Ajouter à openFiles
        setOpenFiles((prev) => [...prev, file])
        
        addTerminalLine(`Created: ${file.filename}`, 'success')
        loadRecents()
      } catch (err) {
        addTerminalLine(`Error creating file: ${(err as Error).message}`, 'error')
      }
    },
    [addTerminalLine, loadRecents, setFileAsDirty]
  )

  const handleSelectFile = useCallback((file: FileData) => {
    setCurrentFile(file)
    setCurrentLanguage(file.language as Language)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const startY = e.clientY
      const startHeight = terminalHeight

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = startY - moveEvent.clientY
        const newHeight = Math.max(80, Math.min(500, startHeight + delta))
        setTerminalHeight(newHeight)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [terminalHeight]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveFile()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRunCode()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewFile()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        handleOpenFile()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSaveFile, handleRunCode, handleNewFile, handleOpenFile])

  const editorHeight = isTerminalCollapsed ? '100%' : `calc(100% - ${terminalHeight + 40}px)`

  return (
    <div className="h-screen w-screen bg-ide-bg flex flex-col overflow-hidden">
      <Header
        currentFile={currentFile}
        isDirty={currentFile ? isDirtyFile(currentFile.filepath) : false}
        currentLanguage={currentLanguage}
        isRunning={isRunning}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onSaveAs={handleSaveAs}
        onRunCode={handleRunCode}
        onLanguageChange={handleLanguageChange}
        onExit={handleExit}
        recents={recents}
        onSelectRecent={(file) => {
          setCurrentFile(file)
          setCurrentLanguage(file.language as Language)
          setFileAsDirty(file.filepath, false)
        }}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        theme={theme}
        onThemeChange={setTheme}
        zoom={zoom}
        onZoomChange={setZoom}
        isFullscreen={isFullscreen}
        onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          openFiles={openFiles}
          currentFile={currentFile}
          onSelectFile={handleSelectFile}
          onCloseFile={handleCloseFile}
          isDirty={isDirtyFile}
          onDeleteFile={handleDeleteFile}
        />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div style={{ height: editorHeight }} className="overflow-hidden transition-all duration-200">
            {currentFile ? (
              <CodeEditor
                file={currentFile}
                language={currentLanguage}
                onChange={handleContentChange}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-ide-surface text-ide-muted">
                <div className="text-center">
                  <p className="text-lg mb-4">No file open</p>
                  <button
                    onClick={handleNewFile}
                    className="px-4 py-2 bg-ide-accent text-ide-bg rounded hover:opacity-90 transition-opacity"
                  >
                    Create New File
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isTerminalCollapsed && (
            <>
              <div
                className="h-1 bg-ide-border hover:bg-ide-accent cursor-row-resize transition-colors"
                onMouseDown={handleMouseDown}
              />
              <div style={{ height: `${terminalHeight}px` }} className="overflow-hidden">
                <Terminal
                  lines={terminalLines}
                  isRunning={isRunning}
                  onClear={clearTerminal}
                  onToggleCollapse={() => setIsTerminalCollapsed(true)}
                />
              </div>
            </>
          )}

          {isTerminalCollapsed && (
            <button
              onClick={() => setIsTerminalCollapsed(false)}
              className="h-8 bg-ide-toolbar border-t border-ide-border-ide-muted hover:text-ide-text text-xs flex items-center justify-center transition-colors"
            >
              ▲ Terminal (collapsed)
            </button>
          )}
        </div>
      </div>

      {showNewFileModal && <NewFileModal onCreate={handleCreateFile} onClose={() => setShowNewFileModal(false)} />}
    </div>
  )
}
