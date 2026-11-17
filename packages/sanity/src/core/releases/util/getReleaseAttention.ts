import {type ReleaseDocument} from '@sanity/client'
import {addDays} from 'date-fns/addDays'

import {ARCHIVED_RELEASE_STATES} from './const'
import {getReleaseTiming} from './getReleaseTiming'

/**
 * How many days ahead an intended (not armed) date counts as "needs a decision".
 *
 * @internal
 */
export const RELEASE_ATTENTION_WINDOW_DAYS = 7

/**
 * Why a release needs a decision from a person.
 *
 * - `overdue`: the intended date has passed and nothing will publish it.
 * - `due-soon`: the intended date is within {@link RELEASE_ATTENTION_WINDOW_DAYS} days, and the
 *   release is not scheduled yet.
 *
 * @internal
 */
export type ReleaseAttentionReason = 'overdue' | 'due-soon'

/**
 * The one rule for "this release needs a decision". It reads only the derived timing
 * ({@link getReleaseTiming}) and the release state, never `metadata.releaseType` or the id, so the
 * planned release model only has to change what it passes in.
 *
 * Returns `null` when the release is scheduled, has no date, is far enough away, or is no longer
 * open (archived or published).
 *
 * @internal
 */
export function getReleaseAttention(
  release: ReleaseDocument,
  now: Date,
): ReleaseAttentionReason | null {
  if (ARCHIVED_RELEASE_STATES.includes(release.state)) return null

  const {intendedNotArmed, date} = getReleaseTiming(release)
  if (!intendedNotArmed || !date) return null

  if (date.getTime() < now.getTime()) return 'overdue'
  if (date.getTime() <= addDays(now, RELEASE_ATTENTION_WINDOW_DAYS).getTime()) return 'due-soon'
  return null
}
