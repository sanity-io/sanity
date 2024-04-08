import {createContext} from 'react'

import type {CommentsContextValue} from '../../../structure/comments/src/context/comments/types'

/**
 * @internal
 */
export const CommentsContext = createContext<CommentsContextValue | null>(null)
