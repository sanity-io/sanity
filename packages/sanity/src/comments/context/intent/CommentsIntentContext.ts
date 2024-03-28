import {createContext} from 'react'

import {type CommentsIntentContextValue} from './types'

export const CommentsIntentContext = createContext<CommentsIntentContextValue | undefined>(
  undefined,
)
