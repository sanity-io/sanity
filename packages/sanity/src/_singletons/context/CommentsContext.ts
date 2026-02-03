import {createContext} from 'sanity/_createContext'

import type {CommentsContextValue} from '../../core/comments/context/comments/types'

/**
 * @internal
 */
export const CommentsContext = createContext<CommentsContextValue | null>(
  'sanity/_singletons/context/comments',
  null,
)
