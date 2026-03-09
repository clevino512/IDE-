import React, { useEffect, useRef } from 'react'
import type { TerminalLine } from '../types'

interface TerminalProps {
  lines: TerminalLine[]
  isRunning: boolean
  onClear: () => void
  onToggleCollapse: () => void
}

export default function Terminal({ lines, isRunning, onClear, onToggleCollapse }: TerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'error':
        return 'text-ide-red'
      case 'info':
        return 'text-ide-muted'
      case 'success':
        return 'text-ide-green'
      case 'output':
      default:
        return 'text-ide-text'
    }
  }

  return (
    <div className="h-full flex flex-col bg-ide-bg border-t border-ide-border">
      <div className="h-8 bg-ide-toolbar border-b border-ide-border flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ide-text">TERMINAL</span>
          {isRunning && (
            <div className="inline-block w-2 h-2 bg-ide-yellow rounded-full animate-pulse-dot" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs text-ide-muted hover:text-ide-text hover:bg-ide-border rounded transition-colors"
          >
            Effacer
          </button>

          <button
            onClick={onToggleCollapse}
            className="px-2 py-1 text-xs text-ide-muted hover:text-ide-text hover:bg-ide-border rounded transition-colors"
          >
            ▼
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-0">
        {lines.length === 0 ? (
          <div className="text-ide-muted">Ready</div>
        ) : (
          lines.map((line) => (
            <div key={line.id} className="flex gap-3 mb-1">
              <span className="text-ide-linenum flex-shrink-0">{line.timestamp}</span>
              <span className={`flex-1 ${getLineColor(line.type)} break-all`}>{line.content}</span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  )
}
