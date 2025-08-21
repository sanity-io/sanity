import {createContext} from 'sanity/_createContext'

import type {DocumentLimitUpsellContextValue} from '../../core/limits/context/documents/types'

/**
 * @internal
 */
export const DocumentLimitUpsellContext = createContext<DocumentLimitUpsellContextValue | null>(
  'sanity/_singletons/context/document-limit-upsell',
  null,
)
