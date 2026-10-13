import {createContext} from 'react'

import type {CommentsAuthoringPathContextValue} from '../../core/comments-v2/context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContextV2 =
  createContext<CommentsAuthoringPathContextValue | null>(null)
