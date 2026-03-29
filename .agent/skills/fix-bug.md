---
name: fix-bug
description: Proceso para diagnosticar y corregir bugs en DarkList
---

# Skill: Corregir un bug en DarkList

## Proceso de diagnóstico

### 1. Identificar la capa afectada

| Síntoma | Capa probable |
|---|---|
| Los datos no se guardan / se pierden al reiniciar | `src/main/ipc/tasks.ts` o `src/main/db.ts` |
| La UI no se actualiza después de una acción | `src/renderer/src/store/taskStore.ts` o la suscripción IPC |
| Error en la consola del renderer | Componente React o store Zustand |
| Error en la consola del main | `src/main/` — revisar logs de Electron |
| Build falla con `Unterminated string literal` | Ver skill `dev-workflow.md` → bug electron-vite |
| Widget no se actualiza | Verificar broadcast `BrowserWindow.getAllWindows()` en IPC handler |

### 2. Reproducir y acotar

- ¿El bug ocurre solo en desarrollo o también en producción?
- ¿Afecta a todos los idiomas o solo a uno?
- ¿Es un problema de estado (Zustand) o de persistencia (SQLite)?

### 3. Localizar el código

Archivos críticos por funcionalidad:

```
Tareas CRUD          → src/main/ipc/tasks.ts
Listas CRUD          → src/main/ipc/lists.ts
Ordenamiento/filtros → src/renderer/src/components/TaskList.tsx
Drag & drop          → src/renderer/src/store/taskStore.ts (reorderTasks)
Recordatorios        → src/main/notifications.ts
Widget               → src/renderer/src/components/WidgetView.tsx
Estadísticas         → src/renderer/src/components/StatsView.tsx
PIN / bloqueo        → src/main/ipc/auth.ts
Sync WebDAV          → src/main/ipc/data.ts
Ajustes / cifrado    → src/main/ipc/settings.ts
Traducciones         → src/renderer/src/i18n/
```

### 4. Reglas de corrección

- **No usar `window.confirm`, `window.alert`, `window.prompt`** — usar `ConfirmModal`.
- **No hacer llamadas IPC dentro de `set()` de Zustand** — hacerlas después.
- **No polling en el renderer** — usar broadcast IPC desde el main.
- **Strings en proceso main no pueden terminar en `import'`** — ver bug electron-vite.
- **Recordatorios**: tras restaurar una tarea, llamar `scheduleReminder(task)`.
- **Undo de eliminación**: la tarea debe eliminarse de DB inmediatamente; el undo usa `tasks:restore`.

### 5. Verificar el fix

```bash
npm run build   # build limpio sin errores TypeScript
npm run dev     # probar el flujo completo
```
