/**
 * Types TypeScript pour le frontend
 * ⚠️ CES SONT JUSTE DES TYPES, PAS DES MODÈLES MONGOOSE
 * Les vrais modèles sont ONLY au backend
 */

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

export interface ExecutionResult {
  output: string
  error: string
  duration: number
}
