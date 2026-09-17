import {createContext} from 'sanity/_createContext'

import type {CommentInputContextValue} from '../../core/comments-v2/components/pte/comment-input/CommentInputProvider'

/**
 * @internal
 */
export const CommentInputContextV2 = createContext<CommentInputContextValue | null>(
  'sanity/_singletons/context/comments-v2-comment-input',
  null,
)
