import {createContext} from 'react'

import {CommentsEnabledContextValue} from '../../../../core/comments/context/enabled/types'

/**
 * @internal
 */
export const CommentsEnabledContext = createContext<CommentsEnabledContextValue | null>(null)
