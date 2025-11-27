import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {CommentsAuthoringPathContextValue} from '../../core/comments/context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContext: Context<CommentsAuthoringPathContextValue | null> =
  createContext<CommentsAuthoringPathContextValue | null>(
    'sanity/_singletons/context/comments-authoring-path',
    null,
  )
