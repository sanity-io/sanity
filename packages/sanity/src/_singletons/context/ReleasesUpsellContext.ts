import {createContext} from 'sanity/_createContext'

import type {ReleasesUpsellContextValue} from '../../core/releases/contexts/upsell/types'

/**
 * @beta
 * @hidden
 */
export const ReleasesUpsellContext = createContext<ReleasesUpsellContextValue | null>(
  'sanity/_singletons/context/releases-upsell',
  null,
)
