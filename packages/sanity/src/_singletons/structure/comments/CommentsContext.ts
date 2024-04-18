import {createContext} from 'react'

import type {CommentsContextValue} from '../../../core/comments/context/comments/types'

/**
 * @internal
 */
export const CommentsContext = createContext<CommentsContextValue | null>(null)
