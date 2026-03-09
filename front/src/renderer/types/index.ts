export type Language = 'py' | 'c' | 'js'

export interface FileData {
  _id?: string
  filename: string
  filepath: string
  language: Language
  content: string
  opened_at?: string
  created_at?: string
}

export interface CreateFileInput {
  filename: string
  language: Language
  filepath: string
}

export interface SaveFileInput {
  filepath: string
  content: string
  language: Language
}

export interface RunCodeInput {
  code: string
  language: Language
  fileId?: string
}

export interface ExecutionResult {
  output: string
  error: string
  duration: number
}

export interface TerminalLine {
  id: string
  timestamp: string
  content: string
  type: 'output' | 'error' | 'info' | 'success'
}
