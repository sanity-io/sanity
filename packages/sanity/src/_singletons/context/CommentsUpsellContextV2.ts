import {createContext} from 'react'

import type {CommentsUpsellContextValue} from '../../core/comments-v2/context/upsell/types'

/**
 * @internal
 */
export const CommentsUpsellContextV2 = createContext<CommentsUpsellContextValue | null>(null)
