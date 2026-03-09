import React, { useState } from 'react'
import type { FileData, Language } from '../types'

interface SidebarProps {
  openFiles: FileData[]
  currentFile: FileData | null
  onSelectFile: (file: FileData) => void
  onCloseFile: (filepath: string) => void
  isDirty: (filepath: string) => boolean
  onDeleteFile?: (filepath: string) => void
}

export default function Sidebar({
  openFiles,
  currentFile,
  onSelectFile,
  onCloseFile,
  isDirty,
  onDeleteFile,
}: SidebarProps) {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ filepath: string; x: number; y: number } | null>(null)

  const getFileIcon = (language: Language) => {
    switch (language) {
      case 'py':
        return '🐍'
      case 'c':
        return '⚙️'
      case 'js':
        return '🟨'
      default:
        return '📄'
    }
  }

  const handleContextMenu = (e: React.MouseEvent, filepath: string) => {
    e.preventDefault()
    setContextMenu({ filepath, x: e.clientX, y: e.clientY })
  }

  const handleDelete = (filepath: string) => {
    if (onDeleteFile) {
      if (window.confirm('Are you sure you want to delete this file?')) {
        onDeleteFile(filepath)
        setContextMenu(null)
      }
    }
  }

  if (openFiles.length === 0) {
    return (
      <div className="w-64 bg-ide-surface border-r border-ide-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-ide-border">
          <h3 className="text-xs font-semibold text-ide-muted uppercase tracking-wider">Open Files</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-ide-muted text-sm">
          No files open
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-ide-surface border-r border-ide-border flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-ide-border">
        <h3 className="text-xs font-semibold text-ide-muted uppercase tracking-wider">
          Open Files <span className="text-ide-accent">({openFiles.length})</span>
        </h3>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {openFiles.map((file) => {
          const isActive = currentFile?.filepath === file.filepath
          const isModified = isDirty(file.filepath)

          return (
            <div
              key={file.filepath}
              onMouseEnter={() => setHoveredFile(file.filepath)}
              onMouseLeave={() => setHoveredFile(null)}
              onContextMenu={(e) => handleContextMenu(e, file.filepath)}
              className={`flex items-center px-3 py-2 cursor-pointer transition-colors group ${
                isActive
                  ? 'bg-ide-border/60 text-ide-accent border-l-2 border-ide-accent'
                  : 'border-l-2 border-transparent hover:bg-ide-border/30 text-ide-text'
              }`}
              onClick={() => onSelectFile(file)}
            >
              {/* Icon */}
              <span className="mr-2 text-base flex-shrink-0">{getFileIcon(file.language)}</span>

              {/* Filename */}
              <span className="flex-1 text-sm truncate" title={file.filepath}>
                {file.filename}
              </span>

              {/* Dirty indicator */}
              {isModified && (
                <span className="w-2 h-2 rounded-full bg-ide-accent flex-shrink-0 mr-2" title="Unsaved changes" />
              )}

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseFile(file.filepath)
                }}
                className={`ml-1 px-1 py-1 rounded text-lg transition-colors flex-shrink-0 ${
                  hoveredFile === file.filepath ? 'opacity-100' : 'opacity-0'
                } hover:bg-red-900/30 hover:text-red-400 text-ide-muted`}
                title="Close file"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-ide-surface border border-ide-border rounded shadow-lg z-50"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
            }}
          >
            <button
              onClick={() => {
                setContextMenu(null)
                const file = openFiles.find((f) => f.filepath === contextMenu.filepath)
                if (file) onSelectFile(file)
              }}
              className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors"
            >
              Switch to FILE
            </button>
            <button
              onClick={() => {
                onCloseFile(contextMenu.filepath)
                setContextMenu(null)
              }}
              className="w-full text-left px-4 py-2 hover:bg-ide-border text-ide-text text-sm transition-colors"
            >
              Close File
            </button>
            <div className="border-t border-ide-border my-1" />
            <button
              onClick={() => handleDelete(contextMenu.filepath)}
              className="w-full text-left px-4 py-2 hover:bg-red-900/30 text-red-400 text-sm transition-colors"
            >
              Delete File
            </button>
          </div>
        </>
      )}
    </div>
  )
}
