import {createContext} from 'react'

import type {CommentInputContextValue} from '../../../../../../core/comments/components/pte/comment-input/CommentInputProvider'

/**
 * @internal
 */
export const CommentInputContext = createContext<CommentInputContextValue | null>(null)
