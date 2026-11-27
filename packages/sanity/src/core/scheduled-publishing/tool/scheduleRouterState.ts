import {isValid} from 'date-fns/isValid'
import {parse} from 'date-fns/parse'

import {SCHEDULE_FILTERS} from '../constants'
import {type ScheduleState} from '../types'

export const DATE_SLUG_FORMAT = 'yyyy-MM-dd' // date-fns format

/**
 * The `state` route param comes from the URL, so it can hold any string. Anything that is not
 * a known filter resolves to `undefined`, which makes the tool fall back to the first filter.
 */
export function getScheduleStateFromRouterState(state: unknown): ScheduleState | undefined {
  return SCHEDULE_FILTERS.find((filter) => filter === state)
}

/**
 * The `date` route param comes from the URL. A slug that does not parse resolves to `undefined`
 * rather than an invalid date, which `format` would throw on.
 */
export function getSelectedDateFromRouterState(date: unknown): Date | undefined {
  if (typeof date !== 'string' || !date) return undefined
  const parsed = parse(date, DATE_SLUG_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}
