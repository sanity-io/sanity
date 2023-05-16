import {defineLanguageBundle} from '../../defineHelpers'
import {studioI18nNamespace} from '../../i18nNamespaces'

export const studioI18nNamespaceStrings = {
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
}

export default defineLanguageBundle({
  namespace: studioI18nNamespace,
  resources: studioI18nNamespaceStrings,
})
