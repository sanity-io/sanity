import {createContext} from 'react'

import type {CommentsAuthoringPathContextValue} from '../../../../structure/comments/src/context/authoring-path/types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContext = createContext<CommentsAuthoringPathContextValue | null>(
  null,
)
