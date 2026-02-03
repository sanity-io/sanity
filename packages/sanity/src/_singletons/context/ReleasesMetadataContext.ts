import type {ReleasesMetadataContextValue} from '../../core/releases/contexts/ReleasesMetadataProvider'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 * @hidden
 */
export const ReleasesMetadataContext = createContext<ReleasesMetadataContextValue | null>(
  'sanity/_singletons/context/releases-metadata',
  null,
)
