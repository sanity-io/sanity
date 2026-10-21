import {isRecord} from '../../util/isRecord'

/**
 * `score()` rejects any expression it cannot evaluate against the dataset's search index —
 * including a boosted field path that a dataset's partial-indexing configuration excludes from
 * indexing. The Content Lake API reports this with this fixed description regardless of which
 * field triggered it, so matching on it lets `createGroq2024Search` retry the request without
 * scoring instead of failing the whole search.
 *
 * See https://linear.app/sanity/issue/SAPP-4706.
 */
const UNSUPPORTED_SCORE_EXPRESSION_MESSAGE = 'score() function received unexpected expression'

/**
 * @internal
 */
export function isUnsupportedScoreExpressionError(error: unknown): boolean {
  if (!isRecord(error)) return false

  const details = isRecord(error.details) ? error.details : undefined
  const description = typeof details?.description === 'string' ? details.description : undefined
  const message = typeof error.message === 'string' ? error.message : undefined

  return (description ?? message ?? '').includes(UNSUPPORTED_SCORE_EXPRESSION_MESSAGE)
}
