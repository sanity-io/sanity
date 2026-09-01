import {createContext} from 'sanity/_createContext'

import type {CommentsSelectedPathContextValue} from '../../core/comments-v2/context/selected-path/types'

/**
 * @internal
 */
export const CommentsSelectedPathContextV2 = createContext<CommentsSelectedPathContextValue | null>(
  'sanity/_singletons/context/comments-v2-selected-path',
  null,
)
