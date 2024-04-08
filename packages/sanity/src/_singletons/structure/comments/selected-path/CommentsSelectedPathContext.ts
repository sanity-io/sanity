import {createContext} from 'react'

import type {CommentsSelectedPathContextValue} from '../../../../structure/comments/src/context/selected-path/types'

/**
 * @internal
 */
export const CommentsSelectedPathContext = createContext<CommentsSelectedPathContextValue | null>(
  null,
)
