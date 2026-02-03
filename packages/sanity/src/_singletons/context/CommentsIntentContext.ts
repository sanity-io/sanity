import type {CommentsIntentContextValue} from '../../core/comments/context/intent/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const CommentsIntentContext = createContext<CommentsIntentContextValue | undefined>(
  'sanity/_singletons/context/comments-intent',
  undefined,
)
