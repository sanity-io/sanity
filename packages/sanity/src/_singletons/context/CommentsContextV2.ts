import {createContext} from 'sanity/_createContext'

import type {CommentsContextValue} from '../../core/comments-v2/context/comments/types'

/**
 * @internal
 */
export const CommentsContextV2 = createContext<CommentsContextValue | null>(
  'sanity/_singletons/context/comments-v2',
  null,
)
