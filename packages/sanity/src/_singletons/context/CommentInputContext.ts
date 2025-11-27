import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {CommentInputContextValue} from '../../core/comments/components/pte/comment-input/CommentInputProvider'

/**
 * @internal
 */
export const CommentInputContext: Context<CommentInputContextValue | null> =
  createContext<CommentInputContextValue | null>('sanity/_singletons/context/comment-input', null)
