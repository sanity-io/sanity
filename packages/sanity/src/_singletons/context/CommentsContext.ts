import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {CommentsContextValue} from '../../core/comments/context/comments/types'

/**
 * @internal
 */
export const CommentsContext: Context<CommentsContextValue | null> =
  createContext<CommentsContextValue | null>('sanity/_singletons/context/comments', null)
