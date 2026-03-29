---
name: dev-workflow
description: Comandos de desarrollo, build y estructura del proyecto DarkList
---

# Skill: Flujo de desarrollo DarkList

## Tecnologías principales

| Capa | Tecnología |
|---|---|
| Framework de escritorio | Electron + electron-vite v5 |
| UI | React 18 + TypeScript + Tailwind CSS |
| Estado | Zustand |
| Base de datos | better-sqlite3 (SQLite síncrono) |
| Configuración persistida | electron-store |
| Drag & Drop | @dnd-kit |
| Build | electron-vite / Vite 7 / esbuild |

## Comandos

```bash
# Desarrollo con hot-reload
npm run dev

# Build de producción (main + preload + renderer)
npm run build

# Empaquetar instalador .exe
npm run package     # o electron-builder
```

## Estructura de procesos Electron

```
src/main/          ← proceso principal (Node.js, acceso a fs/db)
  index.ts         ← ventanas, tray, IPC handlers de app
  db.ts            ← SQLite init, backup automático
  notifications.ts ← recordatorios, scheduleReminder
  ipc/
    tasks.ts       ← CRUD tareas, recurrencia, restore
    lists.ts       ← CRUD listas
    settings.ts    ← get/set ajustes + safeStorage
    auth.ts        ← PIN
    data.ts        ← export/import JSON, WebDAV push/pull
    menu.ts        ← menú contextual nativo

src/preload/       ← bridge seguro main ↔ renderer
  index.ts         ← contextBridge.exposeInMainWorld
  index.d.ts       ← tipos de window.api

src/renderer/src/  ← proceso renderer (React)
  App.tsx          ← router de vistas
  store/           ← Zustand stores
  components/      ← componentes UI
  pages/           ← Settings
  i18n/            ← traducciones por archivo de idioma
  hooks/           ← atajos de teclado

src/shared/        ← tipos compartidos (Task, List, AppSettings)
```

## Patrón IPC

**Renderer → Main (con respuesta):**
```ts
// preload expone:
window.api.updateTask(id, data)  // → ipcRenderer.invoke('tasks:update', ...)

// main registra:
ipcMain.handle('tasks:update', async (_e, id, data) => { ... })
```

**Main → Renderer (broadcast):**
```ts
BrowserWindow.getAllWindows().forEach(win =>
  win.webContents.send('task:updated', task)
)

// renderer escucha en useEffect:
window.api.on('task:updated', (task) => ...)
```

## Conocido: bug electron-vite v5

El `esmShimPlugin` inyecta CommonJS Shims usando regex. Si un string en el proceso principal termina con la palabra `import` antes de la comilla de cierre (ej. `'Confirm import'`), el regex lo detecta como falso `import` y rompe el bundle con `Unterminated string literal`.

**Evitar:** strings en `src/main/**` que terminen en `...import'` o `...import"`.
