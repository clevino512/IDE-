import { contextBridge, ipcRenderer } from 'electron'
import type { FileData, CreateFileInput, SaveFileInput, ExecutionResult, RunCodeInput } from '../renderer/types'

// ✅ Exposer les APIs Electron de manière sécurisée
// Pas d'import de modules Node.js ici - tout passe par IPC!
contextBridge.exposeInMainWorld('electronAPI', {
  tmpdir: (): Promise<string> => ipcRenderer.invoke('app:tmpdir'),
  paths: {
    join: (...args: string[]): Promise<string> => ipcRenderer.invoke('app:path-join', args),
  },
  file: {
    open: (): Promise<FileData | null> => ipcRenderer.invoke('file:open'),
    create: (data: CreateFileInput): Promise<FileData> => ipcRenderer.invoke('file:create', data),
    save: (data: SaveFileInput): Promise<{ success: boolean }> => ipcRenderer.invoke('file:save', data),
    saveDialog: (): Promise<string | null> => ipcRenderer.invoke('file:save-dialog'),
    recents: (): Promise<FileData[]> => ipcRenderer.invoke('file:recents'),
  },
  code: {
    run: (data: RunCodeInput): Promise<ExecutionResult> => ipcRenderer.invoke('code:run', data),
  },
})

declare global {
  interface Window {
    electronAPI: {
      tmpdir: () => Promise<string>
      paths: {
        join: (...args: string[]) => Promise<string>
      }
      file: {
        open: () => Promise<FileData | null>
        create: (data: CreateFileInput) => Promise<FileData>
        save: (data: SaveFileInput) => Promise<{ success: boolean }>
        saveDialog: () => Promise<string | null>
        recents: () => Promise<FileData[]>
      }
      code: {
        run: (data: RunCodeInput) => Promise<ExecutionResult>
      }
    }
  }
}