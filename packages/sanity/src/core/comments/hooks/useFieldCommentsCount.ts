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

  return comments.data.open.filter((comment) => comment.target.path?.field === stringPath).length
}
