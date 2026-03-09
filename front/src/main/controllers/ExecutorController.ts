import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { spawn } from 'child_process'
import { Language, ExecutionResult } from '../types'

export interface RunCodeInput {
  code: string
  language: Language
  fileId?: string
}

interface RawResult {
  output: string
  error: string
}

/**
 * Frontend ExecutorController - exécute le code localement sans backend
 */
export class ExecutorController {
  static async runCode(input: RunCodeInput): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      let result: RawResult

      switch (input.language) {
        case 'py':
          result = await this.runPython(input.code)
          break
        case 'js':
          result = await this.runJavaScript(input.code)
          break
        case 'c':
          result = await this.runC(input.code)
          break
        default:
          throw new Error(`Langage non supporté: ${input.language}`)
      }

      const duration = Date.now() - startTime

      return {
        output: result.output,
        error: result.error,
        duration,
      }
    } catch (err) {
      const duration = Date.now() - startTime
      const errorMsg = (err as Error).message

      return {
        output: '',
        error: errorMsg,
        duration,
      }
    }
  }

  private static async runPython(code: string): Promise<RawResult> {
    const tmpFile = path.join(os.tmpdir(), '_ide_run.py')
    fs.writeFileSync(tmpFile, code)

    try {
      return await this.spawnProcess('python3', [tmpFile], 10000)
    } catch (err) {
      const errMsg = (err as Error).message
      const isMissing = errMsg.includes('ENOENT') || errMsg.includes('not found')

      if (isMissing) {
        return {
          output: '',
          error: '❌ Python3 introuvable\nVérifiez que Python 3 est installé et dans le PATH',
        }
      }

      throw err
    }
  }

  private static async runJavaScript(code: string): Promise<RawResult> {
    const tmpFile = path.join(os.tmpdir(), '_ide_run.js')
    fs.writeFileSync(tmpFile, code)

    try {
      return await this.spawnProcess('node', [tmpFile], 10000)
    } catch (err) {
      const errMsg = (err as Error).message
      const isMissing = errMsg.includes('ENOENT') || errMsg.includes('not found')

      if (isMissing) {
        return {
          output: '',
          error: '❌ Node.js introuvable\nVérifiez que Node.js est installé et dans le PATH',
        }
      }

      throw err
    }
  }

  private static async runC(code: string): Promise<RawResult> {
    const tmpSrc = path.join(os.tmpdir(), '_ide_run.c')
    const tmpBin = path.join(os.tmpdir(), '_ide_out' + (process.platform === 'win32' ? '.exe' : ''))

    fs.writeFileSync(tmpSrc, code)

    try {
      const compileResult = await this.spawnProcess('gcc', [tmpSrc, '-o', tmpBin], 10000)

      if (compileResult.error) {
        return {
          output: '',
          error: '❌ Erreur de compilation:\n' + compileResult.error,
        }
      }

      return await this.spawnProcess(tmpBin, [], 10000)
    } catch (err) {
      const errMsg = (err as Error).message
      const isMissing = errMsg.includes('ENOENT') || errMsg.includes('not found')

      if (isMissing) {
        return {
          output: '',
          error: '❌ GCC introuvable\nVérifiez que GCC est installé et dans le PATH',
        }
      }

      throw err
    }
  }

  private static spawnProcess(cmd: string, args: string[], timeout: number = 10000): Promise<RawResult> {
    return new Promise((resolve, reject) => {
      let output = ''
      let error = ''
      let timedOut = false

      const child = spawn(cmd, args)

      const timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGTERM')
      }, timeout)

      child.stdout?.on('data', (data) => {
        output += data.toString()
      })

      child.stderr?.on('data', (data) => {
        error += data.toString()
      })

      child.on('close', (code) => {
        clearTimeout(timer)

        if (timedOut) {
          reject(new Error(`Timeout: Le programme a dépassé ${timeout}ms`))
        } else if (code !== 0 && code !== null) {
          resolve({ output, error: error || `Erreur d'exécution (code: ${code})` })
        } else {
          resolve({ output, error })
        }
      })

      child.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }
}
