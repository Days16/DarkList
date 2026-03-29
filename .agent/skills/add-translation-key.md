---
name: add-translation-key
description: Añadir una nueva clave de traducción a todos los idiomas
---

# Skill: Añadir una nueva clave de traducción

## Pasos

### 1. Declarar la clave en base.ts

En `src/renderer/src/i18n/base.ts`, añadir la clave al objeto `base`:

```ts
export const base = {
  // ... claves existentes ...
  mi_nueva_clave: '',
}
```

> El tipo `TranslationMap = typeof base` se actualizará automáticamente.
> TypeScript marcará error en todos los archivos de idioma que no incluyan la nueva clave.

### 2. Añadir la traducción en cada archivo de idioma

Los 6 archivos a actualizar:

| Archivo | Idioma |
|---|---|
| `src/renderer/src/i18n/es.ts` | Español |
| `src/renderer/src/i18n/en.ts` | Inglés |
| `src/renderer/src/i18n/fr.ts` | Francés |
| `src/renderer/src/i18n/de.ts` | Alemán |
| `src/renderer/src/i18n/pt.ts` | Portugués |
| `src/renderer/src/i18n/it.ts` | Italiano |

En cada uno añadir al final (antes del cierre `}`):

```ts
  mi_nueva_clave: 'Texto traducido en ese idioma'
```

### 3. Usar la clave en el componente

```ts
const { t } = useUiStore()
// ...
<span>{t('mi_nueva_clave')}</span>
```

### Verificar

```bash
npm run build
```

Si falta la clave en algún idioma, TypeScript lanzará error de tipo.

## Convención de nombres de claves

- `snake_case` siempre
- Prefijos por sección: `pin_`, `sync_`, `theme_`, `sort_`
- Sufijos descriptivos: `_label`, `_placeholder`, `_confirm`, `_desc`, `_action`
