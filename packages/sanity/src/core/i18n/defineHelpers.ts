import type {LanguageDefinition, LanguageResourceBundle} from './types'

/**
 * @todo
 * @alpha
 */
export function defineLanguageResourceBundle(
  bundle: LanguageResourceBundle,
): LanguageResourceBundle {
  return bundle
}

/**
 * Defines a language and makes it available for use in the studio.
 * @alpha
 */
export function defineLanguage(language: LanguageDefinition): LanguageDefinition {
  return language
}
