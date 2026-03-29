export type { TranslationKey } from './base'
import es from './es'
import en from './en'
import fr from './fr'
import de from './de'
import pt from './pt'
import it from './it'

export const translations = { es, en, fr, de, pt, it }

export type Language = keyof typeof translations
