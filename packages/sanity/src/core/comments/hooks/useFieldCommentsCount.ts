import {Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {useComments} from './useComments'

interface FieldCommentsCountHook {
  path: Path
}

/**
 * Get the total number of open comments associated with a field path.
 *
 * @beta
 * @hidden
 */
export function useFieldCommentsCount(opts: FieldCommentsCountHook): number {
  const {comments} = useComments()
  const stringPath = PathUtils.toString(opts.path)

  return comments.data.open.filter((comment) => comment.target.path?.field === stringPath).length
}
