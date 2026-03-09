import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as os from 'os'
import { registerFileIPC } from './ipc/file.ipc'
import { registerExecutorIPC } from './ipc/executor.ipc'

let mainWindow: BrowserWindow | null = null

  const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0F1117',
  })

  // ✅ Enregistrer les IPC AVANT de charger la page
  registerFileIPC(mainWindow)
  registerExecutorIPC()
  
  // ✅ IPC pour des fonctions système
  ipcMain.handle('app:tmpdir', () => os.tmpdir())
  ipcMain.handle('app:path-join', (_event, args: string[]) => path.join(...args))

  if (process.env.NODE_ENV === 'development') {
    // ✅ Attendre que Vite soit prêt avant de charger
    try {
      await waitForVite('http://localhost:5173', 60, 500)
      mainWindow.loadURL('http://localhost:5173')
      mainWindow.webContents.openDevTools()
    } catch (err) {
      console.warn('Failed to connect to Vite dev server, retrying with extended delay:', err)
      // Fallback: essayer après un délai plus long
      await new Promise((resolve) => setTimeout(resolve, 5000))
      try {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
      } catch (fallbackErr) {
        console.error('Fallback load also failed:', fallbackErr)
        // Dernier recours: charger depuis un fichier vide
        const blankHTML = 'data:text/html,<html><body><h1>Waiting for Vite...</h1></body></html>'
        mainWindow.loadURL(blankHTML)
      }
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// ✅ Fonction qui attend que Vite soit disponible
const waitForVite = (url: string, retries = 20, delay = 500): Promise<void> => {
  return new Promise((resolve, reject) => {
    const attempt = async (n: number) => {
      try {
        const http = await import('http')
        const req = http.get(url, (res) => {
          req.destroy()
          if (res.statusCode === 200) {
            resolve()
          } else if (n > 0) {
            setTimeout(() => attempt(n - 1), delay)
          } else {
            reject(new Error('Vite returned non-200 status'))
          }
        }) as any
        
        req.on('error', () => {
          if (n > 0) {
            setTimeout(() => attempt(n - 1), delay)
          } else {
            reject(new Error('Vite not available after retries'))
          }
        })

        req.on('timeout', () => {
          req.destroy()
          if (n > 0) {
            setTimeout(() => attempt(n - 1), delay)
          } else {
            reject(new Error('Vite connection timeout'))
          }
        })

        req.setTimeout(2000)
      } catch (err) {
        if (n > 0) {
          setTimeout(() => attempt(n - 1), delay)
        } else {
          reject(new Error(`Network error: ${(err as Error).message}`))
        }
      }
    }
    attempt(retries)
  })
}

// ✅ Flags pour éviter le crash du service réseau
app.commandLine.appendSwitch('disable-gpu')

// ✅ Gestion globale des promesses rejetées non traitées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

app.on('ready', () => {
  createWindow().catch((err) => {
    console.error('Failed to create window:', err)
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow().catch((err) => {
      console.error('Failed to create window:', err)
    })
  }
})