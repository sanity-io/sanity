import {createContext} from 'react'

import type {CommentsIntentContextValue} from '../../../../core/comments/context/intent/types'

/**
 * @internal
 */
export const CommentsIntentContext = createContext<CommentsIntentContextValue | undefined>(
  undefined,
)
