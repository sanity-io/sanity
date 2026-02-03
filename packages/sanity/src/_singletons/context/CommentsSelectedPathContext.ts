import type {CommentsSelectedPathContextValue} from '../../core/comments/context/selected-path/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const CommentsSelectedPathContext = createContext<CommentsSelectedPathContextValue | null>(
  'sanity/_singletons/context/comments-selected-path',
  null,
)
