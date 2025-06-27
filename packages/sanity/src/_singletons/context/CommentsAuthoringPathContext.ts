import {createContext} from 'sanity/_createContext'

import type {CommentsAuthoringPathContextValue} from '../../core/comments/context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContext: React.Context<CommentsAuthoringPathContextValue | null> =
  createContext('sanity/_singletons/context/comments-authoring-path', null)
