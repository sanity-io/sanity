import {createContext} from 'react'

import type {CommentsSelectedPathContextValue} from '../../core/comments-v2/context/selected-path/types'

/**
 * @internal
 */
export const CommentsSelectedPathContextV2 = createContext<CommentsSelectedPathContextValue | null>(
  null,
)
