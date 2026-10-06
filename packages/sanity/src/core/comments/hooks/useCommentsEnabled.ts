import {use} from 'react'
import {CommentsEnabledContext} from 'sanity/_singletons'

/**
 * Whether comments are enabled for the document, from the workspace's `document.comments.enabled`
 * config. Synchronous and plan-independent: whether the plan has the feature only decides the
 * mode, which `useCommentsMode()` hands out as a promise. `false` outside any
 * `CommentsEnabledProvider`, such as a form rendered without the plugin.
 *
 * @beta
 * @hidden
 */
export function useCommentsEnabled(): boolean {
  return use(CommentsEnabledContext)
}
