import {createContext} from 'sanity/_createContext'

import type {CommentsAuthoringPathContextValue} from '../../core/comments-v2/context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContextV2 =
  createContext<CommentsAuthoringPathContextValue | null>(
    'sanity/_singletons/context/comments-v2-authoring-path',
    null,
  )
