import {createContext} from 'sanity/_createContext'

import type {CommentsContextValue} from '../../core/comments-legacy/context/comments/types'

/**
 * @internal
 */
export const CommentsLegacyContext = createContext<CommentsContextValue | null>(
  'sanity/_singletons/context/comments-legacy',
  null,
)
