import {range} from 'lodash'
import type {StudioLocaleResourceKeys} from '../../../../../../../../../../../i18n'

export const MONTH_NAME_KEYS: StudioLocaleResourceKeys[] = [
  'calendar.month-names.january',
  'calendar.month-names.february',
  'calendar.month-names.march',
  'calendar.month-names.april',
  'calendar.month-names.may',
  'calendar.month-names.june',
  'calendar.month-names.july',
  'calendar.month-names.august',
  'calendar.month-names.september',
  'calendar.month-names.october',
  'calendar.month-names.november',
  'calendar.month-names.december',
]

export const SHORT_WEEK_DAY_KEYS: StudioLocaleResourceKeys[] = [
  'calendar.weekday-names.short.monday',
  'calendar.weekday-names.short.tuesday',
  'calendar.weekday-names.short.wednesday',
  'calendar.weekday-names.short.thursday',
  'calendar.weekday-names.short.friday',
  'calendar.weekday-names.short.saturday',
  'calendar.weekday-names.short.sunday',
]

export const HOURS_24 = range(0, 24)

export const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

// all weekdays except first
export const TAIL_WEEKDAYS = [1, 2, 3, 4, 5, 6]
