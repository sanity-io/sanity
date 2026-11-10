import {createContext} from 'react'

import type {CommentInputContextValue} from '../../core/comments-v2/components/pte/comment-input/CommentInputProvider'

/**
 * @internal
 */
export const CommentInputContextV2 = createContext<CommentInputContextValue | null>(null)
