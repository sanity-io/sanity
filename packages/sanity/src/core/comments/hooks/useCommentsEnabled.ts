import {use} from 'react'
import {CommentsEnabledContext, CommentsModePromiseContext} from 'sanity/_singletons'

import {type CommentsEnabledContextValue} from '../context/enabled/types'

const DISABLED: CommentsEnabledContextValue = {enabled: false, mode: null}

/**
 * Whether comments are enabled for the document and in which mode. Reading the mode suspends
 * until the comments feature check has answered, so call it under the document's Suspense
 * boundary; a document with comments disabled in the config does not wait for it.
 *
 * @beta
 * @hidden
 */
export function useCommentsEnabled(): CommentsEnabledContextValue {
  const enabled = use(CommentsEnabledContext)
  const modePromise = use(CommentsModePromiseContext)
  if (!modePromise) throw new TypeError('CommentsModePromise: missing context value')
  if (!enabled) return DISABLED
  const mode = use(modePromise)
  // A failed feature check disables comments, as before
  if (mode === null) return DISABLED
  return {enabled: true, mode}
}
