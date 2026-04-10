/* eslint-disable @sanity/i18n/no-i18next-import */
import {useCallback, useContext} from 'react'
import {I18nContext} from 'react-i18next'

/**
 * Baked-in English strings for the feedback UI.
 *
 * When the studio's I18nextProvider is present these keys resolve through the
 * full i18n pipeline (custom locales, overrides, etc.). When the provider is
 * absent — for example the dialog is rendered outside of the studio then these values
 * are used as-is, so the UI never shows raw translation keys.
 */
const FEEDBACK_STRINGS: Record<string, string> = {
  'feedback.dialog.title': 'Share feedback with Sanity',
  'feedback.sentiment.label': 'How easy or difficult is Sanity to use?',
  'feedback.sentiment.happy': 'Easy',
  'feedback.sentiment.neutral': 'Not sure',
  'feedback.sentiment.unhappy': 'Difficult',
  'feedback.message.label': 'What is working? What could be better?',
  'feedback.message.placeholder': 'Describe your issue or request...',
  'feedback.attachment.label': 'Attach an image',
  'feedback.attachment.browse': 'Browse',
  'feedback.attachment.drop-zone': 'Drag or paste file here',
  'feedback.attachment.remove': 'Remove',
  'feedback.attachment.error.size': 'Image must be under 20 MB',
  'feedback.consent.label': 'Can we follow up with you about this feedback?',
  'feedback.consent.disclaimer':
    "We'd love to learn more. Selecting yes shares your name and email with the Sanity team.",
  'feedback.consent.yes': 'Yes',
  'feedback.consent.no': 'No',
  'feedback.cancel': 'Cancel',
  'feedback.submit': 'Send feedback',
}

/**
 * Translation hook for feedback components that gracefully degrades
 * when no I18nextProvider is available.
 *
 * @internal
 */
export function useFeedbackTranslation(): {t: (key: string) => string} {
  const i18nContext = useContext(I18nContext)
  const i18n = i18nContext?.i18n

  const t = useCallback(
    (key: string): string => {
      if (i18n?.isInitialized) {
        const result = i18n.t(key, {ns: 'feedback'})
        if (typeof result === 'string' && result !== key) return result
      }
      return FEEDBACK_STRINGS[key] ?? key
    },
    [i18n],
  )

  return {t}
}
