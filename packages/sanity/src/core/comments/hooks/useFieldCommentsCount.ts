import {Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {useComments} from './useComments'

/**
 * Get the total number of open comments associated with a field path.
 *
 * @beta
 * @hidden
 */
export function useFieldCommentsCount(path: Path): number {
  const {comments} = useComments()
  const stringPath = PathUtils.toString(path)

  const count = comments.data.open
    .map((c) => (c.fieldPath === stringPath ? c.commentsCount : 0))
    .reduce((acc, val) => acc + val, 0)

  return count || 0
}
