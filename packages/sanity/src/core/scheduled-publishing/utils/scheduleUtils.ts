import {type Schedule} from '../types'

/**
 * Return a schedule's `executedAt` date if it exists, otherwise just return `executeAt`.
 *
 * When dealing with schedules that may have differing values for `executeAt` and
 * `executedAt` (e.g. schedules force-published ahead of time), for the purposes of
 * rendering and sorting we only care about the _final_ date a schedule was executed.
 *
 * Note that it's possible for both `executedAt` and `executeAt` to be null
 * (if creating Schedules via the Scheduling API without dates).
 */
export function getLastExecuteDate(schedule: Schedule): string | null {
  return schedule?.executedAt || schedule?.executeAt
}
