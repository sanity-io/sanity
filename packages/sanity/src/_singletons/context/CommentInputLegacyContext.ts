import {createContext} from 'sanity/_createContext'

import type {CommentInputContextValue} from '../../core/comments-legacy/components/pte/comment-input/CommentInputProvider'

/**
 * @internal
 */
export const CommentInputLegacyContext = createContext<CommentInputContextValue | null>(
  'sanity/_singletons/context/comments-legacy-comment-input',
  null,
)
