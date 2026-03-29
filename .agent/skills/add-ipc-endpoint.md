---
name: add-ipc-endpoint
description: Añadir un nuevo endpoint IPC entre el proceso principal y el renderer
---

# Skill: Añadir un endpoint IPC

## Patrón completo (4 pasos)

### 1. Implementar el handler en main (`src/main/ipc/`)

```ts
// src/main/ipc/tasks.ts (o el archivo correspondiente)
ipcMain.handle('tasks:myAction', async (_e, param: string) => {
  const db = getDb()
  // lógica...
  return resultado
})
```

> Usar `ipcMain.handle` para operaciones con respuesta.
> Usar `ipcMain.on` para fire-and-forget (sin respuesta).

### 2. Exponer en el preload (`src/preload/index.ts`)

```ts
contextBridge.exposeInMainWorld('api', {
  // ...handlers existentes...
  myAction: (param: string): Promise<Resultado> =>
    ipcRenderer.invoke('tasks:myAction', param),
})
```

### 3. Declarar el tipo (`src/preload/index.d.ts`)

```ts
interface Window {
  api: {
    // ...tipos existentes...
    myAction(param: string): Promise<Resultado>
  }
}
```

### 4. Usar desde el renderer

```ts
const result = await window.api.myAction('valor')
```

## Broadcast (main → todas las ventanas)

Para notificar al renderer de cambios proactivos:

```ts
// En el handler main:
BrowserWindow.getAllWindows().forEach(win =>
  win.webContents.send('myEvent', payload)
)
```

```ts
// En el renderer (useEffect):
useEffect(() => {
  const unsub = window.api.on('myEvent', (payload) => {
    // actualizar store...
  })
  return unsub
}, [])
```

## Convención de nombres de canales

- `entidad:accion` → `tasks:create`, `lists:delete`, `settings:get`
- Eventos broadcast: `task:created`, `task:updated`, `task:deleted`
