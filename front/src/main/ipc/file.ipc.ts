import { ipcMain, BrowserWindow } from 'electron'
import { FileController } from '../controllers/FileController'

export function registerFileIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('file:open', async () => {
    return FileController.openFile(mainWindow)
  })

  ipcMain.handle('file:create', async (_e, data) => {
    return FileController.createFile(data)
  })

  ipcMain.handle('file:save', async (_e, data) => {
    return FileController.saveFile(data)
  })

  ipcMain.handle('file:save-dialog', async () => {
    return FileController.showSaveDialog(mainWindow)
  })

  ipcMain.handle('file:recents', async () => {
    return FileController.getRecents()
  })
}
