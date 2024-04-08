import {createContext} from 'react'

import type {CommentInputContextValue} from '../../../../../../structure/comments'

/**
 * @internal
 */
export const CommentInputContext = createContext<CommentInputContextValue | null>(null)
