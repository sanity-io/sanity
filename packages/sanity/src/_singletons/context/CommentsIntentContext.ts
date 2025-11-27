import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {CommentsIntentContextValue} from '../../core/comments/context/intent/types'

/**
 * @internal
 */
export const CommentsIntentContext: Context<CommentsIntentContextValue | undefined> = createContext<
  CommentsIntentContextValue | undefined
>('sanity/_singletons/context/comments-intent', undefined)
