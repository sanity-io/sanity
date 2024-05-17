import {createContext} from 'react'

import type {CommentsSelectedPathContextValue} from '../../../../core/comments/context/selected-path/types'

/**
 * @internal
 */
export const CommentsSelectedPathContext = createContext<CommentsSelectedPathContextValue | null>(
  null,
)
