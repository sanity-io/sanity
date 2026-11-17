import {createContext} from 'react'

import type {IntentParameters} from '../../router/types'

type CommentsIntentContextValue = (comment: {
  id: string
  type: string
  path: string
}) => {title: string; name: string; params: IntentParameters} | undefined

/**
 * @internal
 */
export const CommentsIntentContext = createContext<CommentsIntentContextValue | undefined>(
  undefined,
)
