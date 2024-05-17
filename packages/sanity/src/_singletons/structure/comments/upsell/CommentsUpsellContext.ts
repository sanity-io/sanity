import {createContext} from 'react'

import type {CommentsUpsellContextValue} from '../../../../core/comments/context/upsell/types'

/**
 * @internal
 */
export const CommentsUpsellContext = createContext<CommentsUpsellContextValue | null>(null)
