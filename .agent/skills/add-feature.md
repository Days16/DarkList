---
name: add-feature
description: Checklist para añadir una nueva funcionalidad a DarkList
---

# Skill: Añadir una nueva funcionalidad

## Checklist

### Diseño previo
- [ ] ¿La feature necesita persistencia en SQLite? → modificar `src/main/db.ts` (schema, migración)
- [ ] ¿Necesita nuevo estado en el renderer? → añadir al store correspondiente en `src/renderer/src/store/`
- [ ] ¿Necesita comunicación main ↔ renderer? → seguir skill `add-ipc-endpoint.md`
- [ ] ¿Tiene textos visibles al usuario? → seguir skill `add-translation-key.md`

### Implementación

**Si toca la base de datos (`src/main/db.ts`):**
- Añadir la nueva columna/tabla en `initDb()`
- Usar `IF NOT EXISTS` o `ALTER TABLE ... ADD COLUMN ... DEFAULT` para no romper instancias existentes

**Si toca el estado Zustand (`src/renderer/src/store/`):**
- Añadir la acción al tipo de la interfaz del store
- IPC calls FUERA del callback de `set()`:
  ```ts
  myAction: (id) => {
    set({ ... })           // actualización optimista
    window.api.doThing(id) // IPC después del set
  }
  ```

**Si toca el tipo `Task` o `AppSettings` (`src/shared/types.ts`):**
- Actualizar el tipo compartido
- TypeScript señalará todos los sitios que necesitan actualización

**Si añade un componente nuevo:**
- Añadir `useUiStore` para acceder a `t()` (traducciones)
- Añadir `useEffect` con listener de `Escape` si el componente es un modal

### Reglas de estilo

| Elemento | Clases Tailwind habituales |
|---|---|
| Card / panel | `bg-elevated rounded-card border border-[#1e1e20]` |
| Botón primario | `bg-accent text-white rounded-input hover:opacity-90` |
| Botón secundario | `bg-elevated text-text-secondary border border-border-color rounded-input` |
| Texto principal | `text-text-primary` |
| Texto secundario | `text-text-secondary text-sm` |
| Badge pequeño | `text-[10px] px-1.5 py-0.5 rounded-full` |
| Color de acento | `var(--accent)` (CSS var) o clase `text-accent`, `bg-accent` |

### Verificación final

```bash
npm run build
```

Sin errores TypeScript = feature integrada correctamente.
