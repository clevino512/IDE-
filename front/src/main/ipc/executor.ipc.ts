import { ipcMain } from 'electron'
import { ExecutorController } from '../controllers/ExecutorController'

export function registerExecutorIPC(): void {
  ipcMain.handle('code:run', async (_e, data) => {
    return ExecutorController.runCode(data)
  })
}
