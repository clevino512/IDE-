import { BrowserWindow, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { Language, FileData } from '../types'

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

const TEMPLATES: Record<Language, string> = {
  py: '# Python Script\nprint("Hello, World!")\n',
  c: '#include <stdio.h>\nint main() { printf("Hello!\\n"); return 0; }\n',
  js: '// JavaScript\nconsole.log("Hello, World!");\n',
}

/**
 * Frontend FileController - gère les fichiers localement sans backend
 */
export class FileController {
  static async openFile(win: BrowserWindow): Promise<FileData | null> {
    try {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Code Files', extensions: ['py', 'c', 'js', 'ts', 'txt'] }],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      const filepath = result.filePaths[0]

      if (!fs.existsSync(filepath)) {
        throw new Error(`Fichier non trouvé: ${filepath}`)
      }

      const content = fs.readFileSync(filepath, 'utf-8')
      const filename = path.basename(filepath)
      const ext = path.extname(filename).slice(1)
      const language = (ext === 'py' ? 'py' : ext === 'c' ? 'c' : 'js') as Language

      return {
        filename,
        filepath,
        language,
        content,
      }
    } catch (err) {
      console.error('❌ Erreur ouverture fichier:', (err as Error).message)
      throw err
    }
  }

  static async createFile(data: CreateFileInput): Promise<FileData> {
    try {
      const { filename, language, filepath } = data
      const template = TEMPLATES[language]

      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true })
      }

      fs.writeFileSync(filepath, template)

      return {
        filename,
        filepath,
        language,
        content: template,
      }
    } catch (err) {
      console.error('❌ Erreur création fichier:', (err as Error).message)
      throw err
    }
  }

  static async saveFile(data: SaveFileInput): Promise<{ success: boolean }> {
    try {
      const { filepath, content } = data
      fs.writeFileSync(filepath, content)
      return { success: true }
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', (err as Error).message)
      throw err
    }
  }

  static async showSaveDialog(win: BrowserWindow): Promise<string | null> {
    try {
      const result = await dialog.showSaveDialog(win, {
        filters: [{ name: 'Code Files', extensions: ['py', 'c', 'js'] }],
      })

      if (result.canceled) {
        return null
      }

      return result.filePath
    } catch (err) {
      console.error('❌ Erreur dialog save:', (err as Error).message)
      return null
    }
  }

  static async getRecents(): Promise<FileData[]> {
    // Pas de recents sans base de données
    return []
  }
}
