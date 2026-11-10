import {createContext} from 'react'

import type {CommentsContextValue} from '../../core/comments-v2/context/comments/types'

/**
 * @internal
 */
export const CommentsContextV2 = createContext<CommentsContextValue | null>(null)
