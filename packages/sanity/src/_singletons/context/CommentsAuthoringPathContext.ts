import type {CommentsAuthoringPathContextValue} from '../../core/comments/context/authoring-path/types'
import {createContext} from 'sanity/_createContext'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContext = createContext<CommentsAuthoringPathContextValue | null>(
  'sanity/_singletons/context/comments-authoring-path',
  null,
)
