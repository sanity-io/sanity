import {createContext} from 'sanity/_createContext'

import type {CommentsUpsellContextValue} from '../../core/comments-v2/context/upsell/types'

/**
 * @internal
 */
export const CommentsUpsellContextV2 = createContext<CommentsUpsellContextValue | null>(
  'sanity/_singletons/context/comments-v2-upsell',
  null,
)
