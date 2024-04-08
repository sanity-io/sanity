import {createContext} from 'react'

import type {CommentsIntentContextValue} from '../../../../structure/comments/src/context/intent/types'

/**
 * @internal
 */
export const CommentsIntentContext = createContext<CommentsIntentContextValue | undefined>(
  undefined,
)
