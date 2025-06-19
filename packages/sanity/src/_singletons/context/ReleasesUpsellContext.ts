import {createContext} from 'sanity/_createContext'

import type {ReleasesUpsellContextValue} from '../../core/releases/contexts/upsell/types'

/**
 * @beta
 * @hidden
 */
export const ReleasesUpsellContext: React.Context<ReleasesUpsellContextValue | null> =
  createContext<ReleasesUpsellContextValue | null>(
    'sanity/_singletons/context/releases-upsell',
    null,
  )
