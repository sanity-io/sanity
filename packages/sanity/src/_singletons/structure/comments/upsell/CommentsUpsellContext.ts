import {createContext} from 'react'

import type {CommentsUpsellContextValue} from '../../../../structure/comments/src/context/upsell/types'

/**
 * @internal
 */
export const CommentsUpsellContext = createContext<CommentsUpsellContextValue | null>(null)
