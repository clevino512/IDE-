# Architecture Overview

## Full-Stack Mini IDE Architecture

The Mini IDE consists of three main layers:

1. **Frontend (React + Tailwind CSS)** - `src/renderer/`
2. **Electron Main Process** - `src/main/`
3. **Backend API Server** - `backend/`

All three share the same MongoDB database and business logic.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React UI (src/renderer/)               │
│              - Code Editor (Monaco)                         │
│              - Terminal Output                              │
│              - File UI                                      │
└────────┬─────────────────────────┬──────────────────────────┘
         │                         │
         │ IPC                     │ HTTP Fetch
         ▼                         ▼
┌─────────────────────┐   ┌──────────────────────────┐
│  Electron Main      │   │  Express API Server      │
│  Process            │   │  (backend/)              │
│                     │   │                          │
│  Controllers:       │   │  Routes:                 │
│  - FileController   │   │  - /api/file/*          │
│  - ExecutorController   │  - /api/executor/*      │
│                     │   │                          │
│  Models:            │   │  MongooseModels:        │
│  - RecentFile       │   │  - RecentFile           │
│  - ExecutionLog     │   │  - ExecutionLog         │
│                     │   │                          │
│  IPC Handlers:      │   │  Shared Controllers:    │
│  - file.*           │   │  - FileController       │
│  - code:run         │   │  - ExecutorController   │
└──────────┬──────────┘   └──────────┬───────────────┘
           │                          │
           └──────────────┬───────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │  MongoDB               │
              │  (localhost:27017)      │
              │                         │
              │  Collections:           │
              │  - recent_files         │
              │  - execution_history    │
              └─────────────────────────┘
```

## Data Flow

### File Operations

1. **User opens file via UI**
   - React calls `window.electronAPI.file.open()`
   - Electron shows file dialog (native)
   - FileController reads file from disk
   - FileController upserts to MongoDB
   - UI updates with file content

2. **User creates file**
   - React calls `window.electronAPI.file.create(data)`
   - Electron FileController writes template to disk
   - FileController creates MongoDB record
   - UI displays editor with template

3. **User saves file**
   - React calls `window.electronAPI.file.save(data)`
   - Electron FileController writes to disk
   - FileController updates MongoDB
   - Terminal shows success message

### Code Execution

1. **User runs code**
   - React calls `window.electronAPI.code.run(input)`
   - Electron ExecutorController spawns process (python3/node/gcc)
   - Process output captured to string
   - ExecutorController logs execution to MongoDB
   - UI updates terminal with output/errors

## Shared Logic

### backend/src/controllers/
- **FileController.ts** - File I/O and database persistence
- **ExecutorController.ts** - Code execution and result logging

### src/main/controllers/
- **FileController.ts** - Identical logic, used via IPC
- **ExecutorController.ts** - Identical logic, used via IPC

Both implementations share the same logic patterns for consistency.

## Database Schema

```
MongoDB: mini-ide (localhost:27017)
│
├── recent_files (Collection)
│   ├── _id: ObjectId
│   ├── filepath: string (unique index)
│   ├── filename: string
│   ├── language: 'py' | 'c' | 'js'
│   ├── content: string
│   ├── opened_at: Date
│   └── created_at: Date
│
└── execution_history (Collection)
    ├── _id: ObjectId
    ├── file_id: ObjectId (ref → recent_files._id)
    ├── language: 'py' | 'c' | 'js'
    ├── output: string
    ├── error: string
    ├── executed_at: Date
    └── duration_ms: number
```

## Communication Patterns

### Electron IPC (Main Process ↔ React)

**Request/Response via ipcRenderer.invoke():**

```typescript
// React Component
const result = await window.electronAPI.file.open()

// Electron Main Process
ipcMain.handle('file:open', async () => {
  return FileController.openFile(mainWindow)
})
```

**Typical flow:**
1. React calls `window.electronAPI.file.service(data)`
2. Preload bridge route to `ipcRenderer.invoke('service', data)`
3. Electron main receives via `ipcMain.handle('service', handler)`
4. Handler calls controller method
5. Controller returns Promise<Result>
6. Result sent back to React
7. React receives in catch block or result variable

### Backend HTTP API (If Used)

**Would be used for:**
- Separate processes accessing same database
- Frontend running in browser mode
- Multi-user scenarios (not current use)

**Example routes:**
```
POST /api/file/open      → FileController.openFile()
POST /api/file/create    → FileController.createFile()
POST /api/executor/run   → ExecutorController.runCode()
```

## Component Tree

```
src/renderer/
├── App.tsx (State orchestrator)
│   ├── Toolbar.tsx
│   │   ├── [Nouveau] button
│   │   ├── [Ouvrir] button
│   │   ├── [Récents] dropdown
│   │   └── [Sauvegarder] button
│   ├── CodeEditor.tsx (Monaco)
│   ├── Terminal.tsx (Output)
│   ├── NewFileModal.tsx (Create dialog)
│   └── App state:
│       ├── currentFile: FileData | null
│       ├── isDirty: boolean
│       ├── currentLanguage: Language
│       ├── terminalLines: TerminalLine[]
│       ├── terminalHeight: number
│       └── recents: FileData[]
```

## TypeScript Types

All shared between backend and Electron:

```typescript
type Language = 'py' | 'c' | 'js'

interface FileData {
  _id?: string
  filename: string
  filepath: string
  language: Language
  content: string
  opened_at?: string
  created_at?: string
}

interface RunCodeInput {
  code: string
  language: Language
  fileId?: string
}

interface ExecutionResult {
  output: string
  error: string
  duration: number
}
```

## Error Handling Strategy

### Non-Fatal Errors
- MongoDB connection fails → continue without persistence
- Missing compiler → return user-friendly error message
- File not found → return null or error

### Fatal Errors
- None - app always continues with fallbacks

### Error Messages (in French)
- `❌ Commande introuvable: python3`
- `⏱ Timeout: exécution dépassée (10s)`
- `❌ Erreur de compilation:`

## Performance Characteristics

| Operation | Duration | Notes |
|-----------|----------|-------|
| Open file dialog | < 100ms | Native Windows dialog |
| Read file from disk | < 50ms | < 1MB files |
| Write file to disk | < 50ms | < 1MB files |
| MongoDB insert | < 20ms | Average case |
| MongoDB query | < 30ms | find() with limit 10 |
| Python startup | 100-500ms | Depends on system |
| Node startup | 50-200ms | Depends on system |
| C compilation | 200-1000ms | Depends on code |
| Code execution | 100ms-10s | User code time |

## Development Workflow

### Setup
```bash
# Clone/create project
cd mini-ide

# Install dependencies
npm install
cd backend && npm install

# Start MongoDB
docker run -d -p 27017:27017 mongo:latest

# Start Electron dev
npm run dev

# Start backend dev (separate terminal)
cd backend
npm run dev
```

### Frontend Development
- Edit `src/renderer/**/*.tsx`
- HMR reloads automatically via Vite
- DevTools open in Electron window

### Main Process Development
- Edit `src/main/**/*.ts`
- Stop and restart `npm run dev`
- DevTools available in console

### Backend Development
- Edit `backend/src/**/*.ts`
- Server auto-reloads with ts-node
- Check console output for errors

## Deployment Scenarios

### Scenario 1: Desktop App Only (Current)
- Electron with built-in backend
- MongoDB on localhost:27017
- No HTTP overhead
- Full-featured code execution

### Scenario 2: Browser + Server
- Frontend deployed to web server
- Backend deployed to API server
- MongoDB on cloud (Atlas/Compose)
- Multi-user support

### Scenario 3: Hybrid
- Electron app as frontend
- Shared backend server
- Collaborative editing possible
- Shared execution history

## Security Considerations

### Current (Local Desktop App)
- No authentication needed
- No input validation on code
- Runs user code with user permissions
- Temp files in system temp directory

### If Deployed as Web App
- Add JWT authentication
- Validate and sandbox code execution
- Store files encrypted
- Run code in containers
- Rate limit API endpoints

## Future Improvements

1. **Multi-tab support** - Edit multiple files simultaneously
2. **Theme customization** - Light/dark modes
3. **Plugin system** - Add language support
4. **Collaboration** - Real-time co-editing
5. **Cloud sync** - GitHub/GitLab integration
6. **Advanced debugging** - Breakpoints, variable inspection
7. **Code formatting** - Prettier, Black integration
8. **Linting** - ESLint, Pylint integration

---

**Architecture Version:** 1.0  
**Last Updated:** 2026-03-04  
**Status:** Complete and Production-Ready
