import {createContext} from 'sanity/_createContext'

import type {CommentInputContextValue} from '../../core/comments/components/pte/comment-input/CommentInputProvider'

/**
 * @internal
 */
export const CommentInputContext: React.Context<CommentInputContextValue | null> = createContext(
  'sanity/_singletons/context/comment-input',
  null,
)
