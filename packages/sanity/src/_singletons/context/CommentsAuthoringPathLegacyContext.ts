import {createContext} from 'sanity/_createContext'

import type {CommentsAuthoringPathContextValue} from '../../core/comments-legacy/context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathLegacyContext =
  createContext<CommentsAuthoringPathContextValue | null>(
    'sanity/_singletons/context/comments-legacy-authoring-path',
    null,
  )
