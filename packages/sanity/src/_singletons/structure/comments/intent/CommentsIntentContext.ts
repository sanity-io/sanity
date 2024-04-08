import {createContext} from 'react'

import {CommentsIntentContextValue} from '../../../../core/comments/context/intent/types'

/**
 * @internal
 */
export const CommentsIntentContext = createContext<CommentsIntentContextValue | undefined>(
  undefined,
)
