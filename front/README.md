# Mini IDE

A minimal desktop code editor IDE built with Electron + React + TypeScript + Tailwind CSS v4 + MongoDB.

## Features

- **Modern Editor**: Monaco Editor with syntax highlighting, bracket colorization, and ligatures
- **Multiple Languages**: Python, C, and JavaScript support
- **Code Execution**: Run code directly with 10-second timeout protection
- **Terminal Integration**: Real-time output with color-coded messages
- **Resizable Layout**: Drag to resize editor and terminal
- **Recent Files**: Quick access to recently opened files via MongoDB
- **Dark Theme**: VS Code-inspired dark interface with custom color palette
- **Keyboard Shortcuts**:
  - `Ctrl+S` / `Cmd+S` - Save file
  - `Ctrl+Enter` / `Cmd+Enter` - Run code
  - `Escape` - Close modals

## Project Structure

```
mini-ide/
├── src/
│   ├── main/
│   │   ├── main.ts                 # Electron main process with IPC handlers
│   │   └── preload.ts              # Context bridge for secure IPC
│   └── renderer/
│       ├── components/
│       │   ├── Toolbar.tsx         # Top bar with controls
│       │   ├── CodeEditor.tsx      # Monaco editor wrapper
│       │   ├── Terminal.tsx        # Output terminal
│       │   └── NewFileModal.tsx    # File creation dialog
│       ├── types/index.ts          # TypeScript type definitions
│       ├── App.tsx                 # Main React component
│       ├── index.tsx               # React entry point
│       └── index.css               # Tailwind v4 + custom styles
├── index.html                      # HTML entry point
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies and scripts
```

## System Requirements

- Node.js 16+ (tested on Node 18+)
- npm or yarn
- MongoDB running on localhost:27017 (or configure in main.ts)
- Python 3, GCC/Clang, and Node.js for code execution support

## Installation

1. **Clone or extract the project**:
```bash
cd mini-ide
```

2. **Install dependencies**:
```bash
npm install
```

3. **Ensure MongoDB is running** (development):
```bash
# Using Docker
docker run -d -p 27017:27017 mongo:latest

# Or using Homebrew on macOS
brew services start mongodb-community

# Or using native installation on Windows/Linux
```

## Development

Start the development server with both Vite and Electron:

```bash
npm run dev
```

This will:
- Start Vite dev server on port 5173
- Wait for the dev server to be ready
- Launch Electron and open DevTools

For development, you can also run components separately:

```bash
# Only compile TypeScript for main process
npm run build:electron

# Only start Vite dev server
npm run vite:dev
```

## Building

Create a production build:

```bash
npm run build
```

This compiles the renderer (React/Vite) and main process (TypeScript).

## Production Package

Create an executable:

```bash
npm run pack
```

This uses electron-builder to create installers for your platform.

## MongoDB Collections

The app uses two MongoDB collections:

### `recent_files`
Stores recently opened files:
```javascript
{
  _id: ObjectId,
  filename: String,
  filepath: String,
  language: 'py' | 'c' | 'js',
  content: String,
  opened_at: Date,
  created_at: Date
}
```

### `execution_history`
Stores code execution results:
```javascript
{
  _id: ObjectId,
  file_id: ObjectId,           // Reference to recent_files._id
  language: 'py' | 'c' | 'js',
  output: String,
  error: String,
  executed_at: Date,
  duration_ms: Number
}
```

## IPC Handlers (Main Process)

### File Operations
- `file:open` - Open file dialog and load file
- `file:create` - Create new file with template
- `file:save` - Save file to disk
- `file:save-dialog` - Show save dialog
- `file:recents` - Get 10 recent files from MongoDB

### Code Execution
- `code:run` - Execute Python, C, or JavaScript code
  - Supports 10-second timeout
  - Returns output, error, and duration
  - Saves results to execution_history collection

## Color Palette

All colors are defined as CSS variables in `src/renderer/index.css`:

- `--color-ide-bg`: #0F1117 (Dark background)
- `--color-ide-surface`: #161B22 (Secondary background)
- `--color-ide-toolbar`: #1C2128 (Toolbar background)
- `--color-ide-border`: #30363D (Border color)
- `--color-ide-accent`: #58A6FF (Primary accent - blue)
- `--color-ide-green`: #3FB950 (Success color)
- `--color-ide-red`: #F85149 (Error color)
- `--color-ide-yellow`: #D29922 (Warning color)
- `--color-ide-text`: #E6EDF3 (Primary text)
- `--color-ide-muted`: #8B949E (Secondary text)
- `--color-ide-linenum`: #3D4450 (Line number color)

## Code Templates

Default templates for new files:

### Python
```python
# Python Script
print("Hello, World!")
```

### C
```c
#include <stdio.h>
int main() { printf("Hello!\n"); return 0; }
```

### JavaScript
```javascript
// JavaScript
console.log("Hello, World!");
```

## Socket Size Debug

If the app feels slow or doesn't render properly, check:

1. **Monaco Editor**: The `automaticLayout: true` option auto-sizes the editor
2. **Terminal**: Fixed height with smooth scrolling
3. **Resizable Divider**: Uses mouse events for drag-to-resize
4. **Memory**: Large file handling - test with files > 10MB

## Troubleshooting

### MongoDB Connection Failed
If you see "MongoDB connection failed" messages:
1. Ensure MongoDB is running on localhost:27017
2. The app will still work but won't save recents or execution history
3. All files will be stored in the system temp directory

### Code Won't Run
- Ensure Python 3, GCC, and Node.js are in your PATH
- Check the terminal output for specific error messages
- Windows users: Use `python` instead of `python3` in PATH

### Editor Not Loading
- Check that Monaco Editor is installed: `npm list @monaco-editor/react`
- Check browser console for errors (DevTools opens in development)

### Hot Reload Not Working
- Vite hot reload works for React components only
- Electron main process changes require manual restart
- Press Ctrl+R in the Electron window to reload the renderer

## License

MIT

## Contributing

See CONTRIBUTING.md for guidelines.

## Support

For issues, feature requests, or questions, please open an issue on GitHub.
