import {createContext} from 'sanity/_createContext'

import type {CommentsMode} from '../../core/comments/context/enabled/types'

/**
 * The comments mode as a promise for `use()`, provided by the `CommentsStudioProvider` of
 * whichever comments plugin is active (only one of the two is registered at a time). Settles once
 * the comments feature check has answered.
 * @internal
 */
export const CommentsModePromiseContext = createContext<Promise<CommentsMode> | null>(
  'sanity/_singletons/context/comments-mode-promise',
  null,
)
