import {isPlainObject} from 'lodash'
import type {LocalizedValidationMessages} from '@sanity/types'
import {LocaleSource} from '../../i18n'

/**
 * Extracts the correct localized validation message based on given locale source
 *
 * @param message - Localized messages to extract string from
 * @param i18n - Locale source, holding the current locale
 * @returns The localized string, or a fallback "Unknown error" if not found
 * @internal
 */
export function localizeMessage(message: LocalizedValidationMessages, i18n: LocaleSource): string {
  const {currentLocale: locale} = i18n

  // Obviously, try direct match first (`no-NB`)
  if (message[locale]) {
    return message[locale]
  }

  // In the case of composed languages (`en-US`, `no-NB` etc), fall back to base language (`en`)
  if (locale.includes('-')) {
    const language = locale.split('-', 1)[0]
    if (message[language]) {
      return message[language]
    }
  }

  // Try english as last resort
  return (
    message['en-US'] || message['en-GB'] || message.en || 'Unknown validation error (not localized)'
  )
}

/**
 * Check if passed message is a localized message object
 *
 * @param message - Message to check
 * @returns True if message is a localized message object, false otherwise
 * @internal
 */
export function isLocalizedMessages(
  message: string | LocalizedValidationMessages | undefined,
): message is LocalizedValidationMessages {
  return typeof message !== 'string' && isPlainObject(message)
}
