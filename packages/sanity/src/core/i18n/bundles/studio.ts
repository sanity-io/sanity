import {defineLocaleResourceBundle} from '../defineHelpers'
import {studioLocaleNamespace} from '../localeNamespaces'

const studioLocaleStrings = {
  /** Placeholder text for the omnisearch input field */
  'navbar.search.placeholder': 'Search',

  /* Relative time, just now */
  'timeAgo.justNow': 'just now',

  /* Relative time, granularity: weeks*/
  'timeAgo.weeks_one': '{{count}} week',
  'timeAgo.weeks_other': '{{count}} weeks',
  /* Relative time, granularity: weeks, configured to show ago suffix*/
  'timeAgo.weeks.ago_one': '{{count}} week ago',
  'timeAgo.weeks.ago_other': '{{count}} weeks ago',
  /* Relative time, granularity: count, using a minimal format*/
  'timeAgo.weeks.minimal': '{{count}}w',
  /* Relative time, granularity: weeks, using a minimal format, configured to show ago suffix*/
  'timeAgo.weeks.minimal.ago': '{{count}}w ago',

  /* Relative time, granularity: days*/
  'timeAgo.days_one': 'yesterday',
  'timeAgo.days_other': '{{count}} days',
  /* Relative time, granularity: days, configured to show ago suffix*/
  'timeAgo.days.ago_one': 'yesterday',
  'timeAgo.days.ago_other': '{{count}} days ago',
  /* Relative time, granularity: days, using a minimal format*/
  'timeAgo.days.minimal_one': 'yesterday',
  'timeAgo.days.minimal_other': '{{count}}d',
  /* Relative time, granularity: days, using a minimal format, configured to show ago suffix*/
  'timeAgo.days.minimal.ago': '{{count}}d ago',

  /* Relative time, granularity: hours*/
  'timeAgo.hours_one': '{{count}} hour',
  'timeAgo.hours_other': '{{count}} hours',
  /* Relative time, granularity: hours, configured to show ago suffix*/
  'timeAgo.hours.ago_one': '{{count}} hour ago',
  'timeAgo.hours.ago_other': '{{count}} hours ago',
  /* Relative time, granularity: hours, using a minimal format*/
  'timeAgo.hours.minimal': '{{count}}h',
  /* Relative time, granularity: hours, using a minimal format, configured to show ago suffix*/
  'timeAgo.hours.minimal.ago': '{{count}}h ago',

  /* Relative time, granularity: minutes*/
  'timeAgo.minutes_one': '{{count}} minute',
  'timeAgo.minutes_other': '{{count}} minutes',
  /* Relative time, granularity: minutes, configured to show ago suffix*/
  'timeAgo.minutes.ago_one': '{{count}} minute ago',
  'timeAgo.minutes.ago_other': '{{count}} minutes ago',
  /* Relative time, granularity: minutes, using a minimal format*/
  'timeAgo.minutes.minimal': '{{count}m',
  /* Relative time, granularity: minutes, using a minimal format, configured to show ago suffix*/
  'timeAgo.minutes.minimal.ago': '{{count}}m ago',

  /* Relative time, granularity: seconds*/
  'timeAgo.seconds_one': '{{count}} second',
  'timeAgo.seconds_other': '{{count}} seconds',
  /* Relative time, granularity: seconds, configured to show ago suffix*/
  'timeAgo.seconds.ago_one': '{{count}} minute ago',
  'timeAgo.seconds.ago_other': '{{count}} second ago',
  /* Relative time, granularity: seconds, using a minimal format*/
  'timeAgo.seconds.minimal': '{{count}m',
  /* Relative time, granularity: seconds, using a minimal format, configured to show ago suffix*/
  'timeAgo.seconds.minimal.ago': '{{count}}m ago',

  /** --- Review Changes --- */

  /** No Changes title in the Review Changes pane */
  'core.review-changes.no-changes-title': 'There are no changes',

  /** No Changes description in the Review Changes pane */
  'core.review-changes.no-changes-description':
    'Edit the document or select an older version in the timeline to see a list of changes appear in this panel.',

  /** Prompt for reverting all changes in document in Review Changes pane */
  'core.review-changes.revert-all-button-prompt': `Are you sure you want to revert all {{count}} changes?`,

  /** Cancel label for revert button prompt action */
  'core.review-changes.revert-button-cancel': `Cancel`,

  /** Revert all label for revert button action - used on prompt button + review changes pane */
  'core.review-changes.revert-button-revert-all': `Revert all`,

  /** --- Review Changes: Field --- */

  /** Revert changes prompt for field change */
  'core.review-changes.revert-button-prompt': `Are you sure you want to revert the changes?`,

  /** Revert changes label for button for field change */
  'core.review-changes.revert-button-change': `Revert change`,
}

/**
 * The i18n resource keys for the studio.
 *
 * @alpha
 * @hidden
 */
export type StudioLocaleResourceKeys = keyof typeof studioLocaleStrings

/**
 * Locale resources for the core studio namespace, eg US English locale resources.
 *
 * @beta
 * @hidden
 */
export const studioDefaultLocaleResources = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: studioLocaleNamespace,
  resources: studioLocaleStrings,
})
