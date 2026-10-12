import {use} from 'react'
import {CommentsModePromiseContext} from 'sanity/_singletons'

import {type CommentsMode} from '../context/enabled/types'

/**
 * The comments mode as a promise: `'default'` when the plan has the feature, `'upsell'` when it
 * does not, `null` when the feature check failed (comments then stay out of the way, as if
 * disabled). Settles once the check has answered. Read it with `use()` in the leaf that renders
 * differently per mode, under a `Suspense` boundary; never on a path whose suspension would hold
 * up a layout, and never awaited in an event handler.
 *
 * @beta
 * @hidden
 */
export function useCommentsMode(): Promise<CommentsMode> {
  const promise = use(CommentsModePromiseContext)
  if (!promise) throw new TypeError('CommentsModePromise: missing context value')
  return promise
}
