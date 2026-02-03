import {createContext} from 'sanity/_createContext'

import type {CommentInputContextValue} from '../../core/comments/components/pte/comment-input/CommentInputProvider'

/**
 * @internal
 */
export const CommentInputContext = createContext<CommentInputContextValue | null>(
  'sanity/_singletons/context/comment-input',
  null,
)
