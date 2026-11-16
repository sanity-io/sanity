import {type ReleaseDocument} from '@sanity/client'
import {isPast} from 'date-fns/isPast'

import {getPublishDateFromRelease, isReleaseScheduledOrScheduling} from './util'

/**
 * The two-state timing model, derived (never stored). A release is either:
 *  - **scheduled** — an armed timer will auto-publish it at `date`, or
 *  - **unscheduled** — no armed timer; it publishes when a person clicks Publish.
 *
 * An unscheduled release may still carry an intended `date` (a plan, not a
 * commitment) — that's `intendedNotArmed`. The legacy `metadata.releaseType`
 * enum (asap/scheduled/undecided) is a Studio-only fiction: the Content Lake
 * service never stored it, and this binary is a pure projection of `state` +
 * `publishAt` + `intendedPublishAt`. See
 * docs/initiatives/releases-overview-redesign/naming-model-decision.md.
 *
 * @internal
 */
export interface ReleaseTiming {
  /** An armed timer will auto-publish the release (state `scheduled`/`scheduling`). */
  scheduled: boolean
  /** The effective date to show: the armed `publishAt`, else the intended date. `null` when neither. */
  date: Date | null
  /** A date is set, but the release is NOT armed — a plan, not a commitment. */
  intendedNotArmed: boolean
  /** The intended (not-armed) date is in the past. */
  overdue: boolean
}

/** @internal */
export function getReleaseTiming(release: ReleaseDocument): ReleaseTiming {
  const scheduled = isReleaseScheduledOrScheduling(release)
  const date = getPublishDateFromRelease(release)
  const intendedNotArmed = !scheduled && date !== null
  const overdue = intendedNotArmed && isPast(date)

  return {scheduled, date, intendedNotArmed, overdue}
}
