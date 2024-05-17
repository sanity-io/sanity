import {createContext} from 'react'

import type {CommentsAuthoringPathContextValue} from '../../../../core/comments/context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContext = createContext<CommentsAuthoringPathContextValue | null>(
  null,
)
