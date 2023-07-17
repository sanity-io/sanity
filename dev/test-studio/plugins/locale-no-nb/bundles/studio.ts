import type {StudioLocaleResourceKeys} from 'sanity'

const studioResources: Record<StudioLocaleResourceKeys, string> = {
  /** Placeholder text for the omnisearch input field */
  'navbar.search.placeholder': 'Søk',

  /* Relative time, just now */
  'timeAgo.justNow': 'akkurat nå',

  /* Relative time, granularity: weeks*/
  'timeAgo.weeks_one': '{{count}} uke',
  'timeAgo.weeks_other': '{{count}} uker',
  /* Relative time, granularity: weeks, configured to show ago suffix*/
  'timeAgo.weeks.ago_one': '{{count}} uke siden',
  'timeAgo.weeks.ago_other': '{{count}} uker siden',
  /* Relative time, granularity: count, using a minimal format*/
  'timeAgo.weeks.minimal': '{{count}}u',
  /* Relative time, granularity: weeks, using a minimal format, configured to show ago suffix*/
  'timeAgo.weeks.minimal.ago': '{{count}}u siden',

  /* Relative time, granularity: days*/
  'timeAgo.days_one': 'i går',
  'timeAgo.days_other': '{{count}} dager',
  /* Relative time, granularity: days, configured to show ago suffix*/
  'timeAgo.days.ago_one': 'i går',
  'timeAgo.days.ago_other': '{{count}} dager siden',
  /* Relative time, granularity: days, using a minimal format*/
  'timeAgo.days.minimal_one': 'i går',
  'timeAgo.days.minimal_other': '{{count}}d',
  /* Relative time, granularity: days, using a minimal format, configured to show ago suffix*/
  'timeAgo.days.minimal.ago': '{{count}}d siden',

  /* Relative time, granularity: hours*/
  'timeAgo.hours_one': 'en time',
  'timeAgo.hours_other': '{{count}} timer',
  /* Relative time, granularity: hours, configured to show ago suffix*/
  'timeAgo.hours.ago_one': 'en time siden',
  'timeAgo.hours.ago_other': '{{count}} timer siden',
  /* Relative time, granularity: hours, using a minimal format*/
  'timeAgo.hours.minimal': '{{count}}t',
  /* Relative time, granularity: hours, using a minimal format, configured to show ago suffix*/
  'timeAgo.hours.minimal.ago': '{{count}}t siden',

  /* Relative time, granularity: minutes*/
  'timeAgo.minutes_one': 'ett minutt',
  'timeAgo.minutes_other': '{{count}} minutter',
  /* Relative time, granularity: minutes, configured to show ago suffix*/
  'timeAgo.minutes.ago_one': 'ett minutt siden',
  'timeAgo.minutes.ago_other': '{{count}} minutter siden',
  /* Relative time, granularity: minutes, using a minimal format*/
  'timeAgo.minutes.minimal': '{{count}m',
  /* Relative time, granularity: minutes, using a minimal format, configured to show ago suffix*/
  'timeAgo.minutes.minimal.ago': '{{count}}m siden',

  /* Relative time, granularity: seconds*/
  'timeAgo.seconds_one': 'ett sekund',
  'timeAgo.seconds_other': '{{count}} sekunder',
  /* Relative time, granularity: seconds, configured to show ago suffix*/
  'timeAgo.seconds.ago_one': 'ett sekund siden',
  'timeAgo.seconds.ago_other': '{{count}} second ago',
  /* Relative time, granularity: seconds, using a minimal format*/
  'timeAgo.seconds.minimal': '{{count}m',
  /* Relative time, granularity: seconds, using a minimal format, configured to show ago suffix*/
  'timeAgo.seconds.minimal.ago': '{{count}}m ago',
}

export default studioResources
