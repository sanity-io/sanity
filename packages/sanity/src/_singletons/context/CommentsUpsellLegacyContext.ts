import {createContext} from 'sanity/_createContext'

import type {CommentsUpsellContextValue} from '../../core/comments-legacy/context/upsell/types'

/**
 * @internal
 */
export const CommentsUpsellLegacyContext = createContext<CommentsUpsellContextValue | null>(
  'sanity/_singletons/context/comments-legacy-upsell',
  null,
)
