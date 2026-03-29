---
name: add-language
description: Añadir un nuevo idioma a DarkList
---

# Skill: Añadir un idioma nuevo a DarkList

## Pasos

### 1. Crear el archivo de traducción

Crea `src/renderer/src/i18n/<código>.ts` (ej. `ja.ts` para japonés):

```ts
import type { TranslationMap } from './base'

const ja: TranslationMap = {
  settings: '設定',
  // ... todas las claves de base.ts
}

export default ja
```

> Todas las claves están definidas en `src/renderer/src/i18n/base.ts`. El compilador TypeScript marcará error si falta alguna.

### 2. Registrar el idioma en translations.ts

En `src/renderer/src/i18n/translations.ts`, añadir:

```ts
import ja from './ja'

export const translations = { es, en, fr, de, pt, it, ja }
```

### 3. Actualizar el tipo en shared/types.ts

En `src/shared/types.ts`, ampliar la unión:

```ts
language: 'es' | 'en' | 'fr' | 'de' | 'pt' | 'it' | 'ja'
```

### 4. Añadir el botón en Settings.tsx

En `src/renderer/src/pages/Settings.tsx`, en el array de idiomas:

```ts
{ label: '日本語', value: 'ja' },
```

### 5. Añadir etiquetas de días para el gráfico semanal

En `src/renderer/src/components/StatsView.tsx`, en `DAY_LABELS`:

```ts
ja: ['日', '月', '火', '水', '木', '金', '土'],
```

### 6. Actualizar el tray (opcional)

En `src/main/index.ts`, función `getTrayLabels()`, añadir la rama del idioma con las tres etiquetas: open, lock, quit.

### Verificar

```bash
npm run build
```

El build debe completar sin errores. TypeScript garantiza que no falten claves.
