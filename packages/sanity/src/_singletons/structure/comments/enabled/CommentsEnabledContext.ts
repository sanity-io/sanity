import {createContext} from 'react'

import type {CommentsEnabledContextValue} from '../../../../structure/comments/src/context/enabled/types'

/**
 * @internal
 */
export const CommentsEnabledContext = createContext<CommentsEnabledContextValue | null>(null)
