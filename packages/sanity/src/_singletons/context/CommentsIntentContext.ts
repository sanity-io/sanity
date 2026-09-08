import {createContext} from 'sanity/_createContext'

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
  'sanity/_singletons/context/comments-intent',
  undefined,
)
