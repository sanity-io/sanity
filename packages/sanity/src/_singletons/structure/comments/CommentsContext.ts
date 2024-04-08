import {createContext} from 'react'

import {CommentsContextValue} from '../../../core/comments/context/comments/types'

/**
 * @internal
 */
export const CommentsContext = createContext<CommentsContextValue | null>(null)
