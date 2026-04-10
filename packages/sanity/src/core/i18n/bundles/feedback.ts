/* eslint sort-keys: "error" */
import {defineLocalesResources} from '../helpers'
import {feedbackLocaleNamespace} from '../localeNamespaces'
import {type LocaleResourceBundle} from '../types'

/**
 * The string resources for the feedback UI.
 *
 * @internal
 * @hidden
 */
const feedbackLocaleStrings = defineLocalesResources('feedback', {
  /** Browse button text */
  'feedback.attachment.browse': 'Browse',
  /** Drop zone text for image attachment */
  'feedback.attachment.drop-zone': 'Drag or paste file here',
  /** Error shown when attached image exceeds size limit */
  'feedback.attachment.error.size': 'Image must be under 20 MB',
  /** Label for the image attachment section */
  'feedback.attachment.label': 'Attach an image',
  /** Remove attached image button text */
  'feedback.attachment.remove': 'Remove',
  /** Cancel button text */
  'feedback.cancel': 'Cancel',
  /** Consent disclaimer shown when the user agrees to follow up */
  'feedback.consent.disclaimer': `We'd love to learn more. Selecting yes shares your name and email with the Sanity team.`,
  /** Label for the contact consent toggle */
  'feedback.consent.label': 'Can we follow up with you about this feedback?',
  /** Consent toggle: no */
  'feedback.consent.no': 'No',
  /** Consent toggle: yes */
  'feedback.consent.yes': 'Yes',
  /** Title of the feedback dialog */
  'feedback.dialog.title': 'Share feedback with Sanity',
  /** Toast message after failed submission */
  'feedback.error': 'Failed to submit feedback with error',
  /** Label for "send feedback" in the help resources menu */
  'feedback.menu-item': 'Send feedback',
  /** Label for the message field */
  'feedback.message.label': 'What is working? What could be better?',
  /** Placeholder for the message field */
  'feedback.message.placeholder': 'Describe your issue or request...',
  /** Sentiment option: happy */
  'feedback.sentiment.happy': 'Easy',
  /** Label for the sentiment question */
  'feedback.sentiment.label': 'How easy or difficult is Sanity to use?',
  /** Sentiment option: neutral */
  'feedback.sentiment.neutral': 'Not sure',
  /** Sentiment option: unhappy */
  'feedback.sentiment.unhappy': 'Difficult',
  /** Submit button text */
  'feedback.submit': 'Send feedback',
  /** Toast message after successful submission */
  'feedback.success': 'Feedback submitted, thank you!',
} as const)

/**
 * The i18n resource keys for feedback.
 *
 * @alpha
 * @hidden
 */
export type FeedbackLocaleResourceKeys = keyof typeof feedbackLocaleStrings

/**
 * Locale resources for the feedback namespace, eg US English locale resources.
 *
 * @beta
 * @hidden
 */
export const feedbackLocaleResources: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: feedbackLocaleNamespace,
  resources: feedbackLocaleStrings,
}
