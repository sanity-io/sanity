import {createContext} from 'sanity/_createContext'

import type {ReleasesMetadataContextValue} from '../../core/releases/contexts/ReleasesMetadataProvider'

/**
 * @internal
 * @hidden
 */
export const ReleasesMetadataContext = createContext<ReleasesMetadataContextValue | null>(
  'sanity/_singletons/context/releases-metadata',
  null,
)
