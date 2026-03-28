# DarkList

A minimalist, dark-themed offline todo list application for Windows 11 with PIN authentication and local persistence.

## Features

- **Offline-First**: All data is stored locally using SQLite. No internet connection required.
- **PIN Authentication**: Secure your tasks with a PIN-protected lock screen.
- **Task Organization**: Create multiple lists/categories to organize your tasks.
- **Task Priorities**: Mark tasks with low, medium, or high priority levels.
- **Due Dates & Reminders**: Set due dates and native desktop notifications for reminders.
- **Dark Theme**: Minimalist dark interface optimized for reduced eye strain.
- **Fast & Lightweight**: Built with Electron and React for a responsive desktop experience.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Desktop Framework** | Electron 41.1.0 |
| **UI Library** | React 18.3.1 + TypeScript 5.5.3 |
| **Bundler** | Vite 8.0.3 (via electron-vite 5.0.0) |
| **Styling** | Tailwind CSS 3.4.6 (dark mode) |
| **State Management** | Zustand 4.5.2 |
| **Database** | SQLite via better-sqlite3 12.8.0 |
| **Security** | bcryptjs 2.4.3 (PIN hashing) |
| **Config Storage** | electron-store 8.2.0 |
| **Build & Distribution** | electron-builder 26.8.1 (NSIS .exe installer) |

## Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Windows 10 or later** (tested on Windows 11)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/darklist.git
cd darklist

# Install dependencies
npm install

# (Optional) Rebuild native modules if needed
npm run rebuild-native
```

## Development

```bash
# Start development server with hot reload
npm run dev
```

The app will open in a new window with hot reload enabled for both the React renderer and Electron main process.

## Building

### Development Build
```bash
npm run build
```
Compiles TypeScript and prepares the `out/` directory for running.

### Preview Built App
```bash
npm run preview
```

### Distribution (Windows Installer)
```bash
npm run dist
```
Creates an NSIS Windows installer in the `dist/` folder.

## Project Structure

```
src/
├── main/                          # Electron main process (Node.js)
│   ├── index.ts                   # Entry point
│   ├── db.ts                      # SQLite initialization & migrations
│   ├── notifications.ts            # Reminder scheduler
│   └── ipc/
│       ├── auth.ts                # PIN authentication handlers
│       ├── tasks.ts               # Task CRUD handlers
│       ├── lists.ts               # List CRUD handlers
│       └── settings.ts            # Settings handlers
│
├── preload/                       # Preload script (IPC bridge)
│   └── index.ts                   # Exposes safe IPC methods to renderer
│
├── renderer/                      # React UI (Renderer process)
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Router & auth guard
│   ├── pages/
│   │   ├── LockScreen.tsx         # PIN entry screen
│   │   ├── Home.tsx               # Main task dashboard
│   │   └── Settings.tsx           # App settings
│   ├── components/
│   │   ├── Sidebar.tsx            # List navigation
│   │   ├── TaskList.tsx           # Task list display
│   │   ├── TaskItem.tsx           # Individual task row
│   │   ├── TaskInput.tsx          # Quick task creation
│   │   ├── FilterBar.tsx          # Task filtering & sorting
│   │   ├── NewListModal.tsx       # Create/edit list modal
│   │   ├── ConfirmModal.tsx       # Generic confirmation dialog
│   │   ├── PinPad.tsx             # PIN input component
│   │   └── Snackbar.tsx           # Toast notifications
│   ├── store/
│   │   ├── authStore.ts           # Auth state (Zustand)
│   │   ├── taskStore.ts           # Task state (Zustand)
│   │   ├── listStore.ts           # List state (Zustand)
│   │   └── uiStore.ts             # UI state (Zustand)
│   └── hooks/
│       └── useAutoLock.ts         # Auto-lock timeout hook
│
└── shared/
    └── types.ts                   # Shared TypeScript interfaces
```

## Architecture

DarkList follows the classic **Electron dual-process model**:

### Main Process (Node.js / Electron)
- Manages SQLite database connections
- Handles all database CRUD operations
- Provides IPC handlers for the renderer process
- Manages desktop notifications and reminders
- No UI rendering—purely backend logic

### Renderer Process (React)
- Renders the UI with React and Tailwind CSS
- Manages local state with Zustand
- **Never accesses the database directly**
- Communicates with main process via IPC (`ipcRenderer.invoke` / `ipcMain.handle`)

### IPC Communication
All cross-process communication is abstracted through IPC handlers:
- `auth:checkPin` — Verify entered PIN
- `auth:setPin` — Create initial PIN
- `auth:changePin` — Update existing PIN
- `tasks:create`, `tasks:read`, `tasks:update`, `tasks:delete` — Task CRUD
- `lists:create`, `lists:read`, `lists:update`, `lists:delete` — List CRUD
- `settings:get`, `settings:set` — User preferences

### Data Flow
```
User Input (React UI)
    ↓
ipcRenderer.invoke('channel:action', data)
    ↓
Main Process IPC Handler
    ↓
SQLite Database Query
    ↓
Response back to Renderer
    ↓
State Update (Zustand)
    ↓
UI Re-render
```

## Database Schema

```sql
-- Lists/Categories
CREATE TABLE lists (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Tasks
CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,
  list_id     TEXT REFERENCES lists(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  done        INTEGER NOT NULL DEFAULT 0,
  priority    INTEGER NOT NULL DEFAULT 2,  -- 1=low, 2=medium, 3=high
  due_date    INTEGER,                      -- Unix timestamp
  reminder_at INTEGER,                      -- Unix timestamp
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Configuration
CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## Development Tips

### Hot Reload
- Renderer changes auto-reload without restarting the app
- Main process changes require a restart (use `npm run dev` to restart)

### TypeScript Support
- Full type checking across main, renderer, and shared code
- Path aliases configured (`@renderer`, `@shared`) for cleaner imports

### State Management
- Zustand stores are located in `src/renderer/store/`
- Subscribe to store changes for reactive updates
- Persist state to disk using `electron-store` for sensitive config (PIN hash, etc.)

### Testing Locally
- PIN defaults to `0000` on first run (set via `SetupPin.tsx` page)
- Clear SQLite database: delete the app data folder (`~\AppData\Roaming\DarkList\`)

## Building for Release

1. Update version in `package.json`
2. Update changelog (if applicable)
3. Run `npm run dist` to create the installer
4. Installer will be in `dist/` as `DarkList-x.x.x.exe`
5. Distribute to users

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow Prettier formatting (configured in project)
- Use Tailwind CSS utilities for styling (no inline CSS)
- Keep components small and focused

### File Naming
- React components: PascalCase (`TaskItem.tsx`)
- Utilities/hooks: camelCase (`useAutoLock.ts`)
- Stores: camelCase (`taskStore.ts`)
- All TypeScript files: `.ts` or `.tsx`

### Adding Features
1. Create feature branch from `main`
2. Update types in `src/shared/types.ts` if needed
3. Add IPC handlers in `src/main/ipc/` for database access
4. Create React components in `src/renderer/components/`
5. Update Zustand store for state management
6. Test thoroughly in development mode

## License

MIT License — See LICENSE file for details.

## Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

**Made with ❤️ for minimalist productivity.**
