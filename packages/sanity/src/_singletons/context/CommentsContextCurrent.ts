import {createContext} from 'sanity/_createContext'

import type {CommentsContextValue} from '../../core/comments-current/context/comments/types'

/**
 * Store context for the default (addon-dataset) comments implementation.
 *
 * @internal
 */
export const CommentsContextCurrent = createContext<CommentsContextValue | null>(
  'sanity/_singletons/context/comments-current',
  null,
)
