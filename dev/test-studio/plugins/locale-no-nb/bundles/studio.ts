import type {StudioLocaleResourceKeys} from 'sanity'

const studioResources: Record<StudioLocaleResourceKeys, string> = {
  /** Placeholder text for the omnisearch input field */
  'search.placeholder': 'Søk',

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
  'timeAgo.minutes.minimal': '{{count}}m',
  /* Relative time, granularity: minutes, using a minimal format, configured to show ago suffix*/
  'timeAgo.minutes.minimal.ago': '{{count}}m siden',

  /* Relative time, granularity: seconds*/
  'timeAgo.seconds_one': 'ett sekund',
  'timeAgo.seconds_other': '{{count}} sekunder',
  /* Relative time, granularity: seconds, configured to show ago suffix*/
  'timeAgo.seconds.ago_one': 'ett sekund siden',
  'timeAgo.seconds.ago_other': '{{count}} second ago',
  /* Relative time, granularity: seconds, using a minimal format*/
  'timeAgo.seconds.minimal': '{{count}}m',
  /* Relative time, granularity: seconds, using a minimal format, configured to show ago suffix*/
  'timeAgo.seconds.minimal.ago': '{{count}}m ago',

  /** --- DateTime (and Date) Input --- */

  /** Action message for navigating to previous month */
  'inputs.datetime.calendar.action.previous-month': `Forrige måned`,
  /** Action message for navigating to next year */
  'inputs.datetime.calendar.action.next-year': `Neste år`,
  /** Action message for navigating to previous year */
  'inputs.datetime.calendar.action.previous-year': `Forrige år`,
  /** Action message for selecting hour */
  'inputs.datetime.calendar.action.select-hour': `Velg time`,
  /** Action message for setting to current time */
  'inputs.datetime.calendar.action.set-to-current-time': `Sett til nå`,

  /** Month names */
  'inputs.datetime.calendar.month-names.january': 'Januar',
  'inputs.datetime.calendar.month-names.february': 'Februar',
  'inputs.datetime.calendar.month-names.march': 'Mars',
  'inputs.datetime.calendar.month-names.april': 'April',
  'inputs.datetime.calendar.month-names.may': 'Mai',
  'inputs.datetime.calendar.month-names.june': 'Juni',
  'inputs.datetime.calendar.month-names.july': 'Juli',
  'inputs.datetime.calendar.month-names.august': 'August',
  'inputs.datetime.calendar.month-names.september': 'September',
  'inputs.datetime.calendar.month-names.october': 'Oktober',
  'inputs.datetime.calendar.month-names.november': 'November',
  'inputs.datetime.calendar.month-names.december': 'Desember',

  /** Short weekday names */
  'inputs.datetime.calendar.weekday-names.short.monday': 'Man',
  'inputs.datetime.calendar.weekday-names.short.tuesday': 'Tir',
  'inputs.datetime.calendar.weekday-names.short.wednesday': 'Ons',
  'inputs.datetime.calendar.weekday-names.short.thursday': 'Tor',
  'inputs.datetime.calendar.weekday-names.short.friday': 'Fre',
  'inputs.datetime.calendar.weekday-names.short.saturday': 'Lør',
  'inputs.datetime.calendar.weekday-names.short.sunday': 'Søn',

  /** Label for selecting a hour preset. Receives a `time` param as a string on hh:mm format and a `date` param as a Date instance denoting the preset date */
  'inputs.datetime.calendar.action.set-to-time-preset': '{{time}} on {{date, datetime}}',
}

export default studioResources
