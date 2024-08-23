import {range} from 'lodash'

export const DEFAULT_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const DEFAULT_WEEK_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const HOURS_24 = range(0, 24)

export const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

export const DEFAULT_TIME_PRESETS = [
  [0, 0],
  [6, 0],
  [12, 0],
  [18, 0],
  [23, 59],
]

// all weekdays except first
export const TAIL_WEEKDAYS = [1, 2, 3, 4, 5, 6]
