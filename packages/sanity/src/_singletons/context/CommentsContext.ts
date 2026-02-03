import type {CommentsContextValue} from '../../core/comments/context/comments/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const CommentsContext = createContext<CommentsContextValue | null>(
  'sanity/_singletons/context/comments',
  null,
)
