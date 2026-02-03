import type {ReleasesUpsellContextValue} from '../../core/releases/contexts/upsell/types'
import {createContext} from 'sanity/_createContext'

/**
 * @beta
 * @hidden
 */
export const ReleasesUpsellContext = createContext<ReleasesUpsellContextValue | null>(
  'sanity/_singletons/context/releases-upsell',
  null,
)
