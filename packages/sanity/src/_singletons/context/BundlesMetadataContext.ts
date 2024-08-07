import {createContext} from 'sanity/_createContext'

import type {BundlesMetadataContextValue} from '../../core/releases/contexts/BundlesMetadataProvider'

/**
 * @internal
 * @hidden
 */
export const BundlesMetadataContext = createContext<BundlesMetadataContextValue | null>(
  'sanity/_singletons/context/bundles-metadata',
  null,
)
