import {createContext} from 'sanity/_createContext'

import type {ResourceCache} from '../../core/store/_legacy/ResourceCacheProvider'

/**
 * @internal
 */
export const ResourceCacheContext = createContext<ResourceCache | null>(
  'sanity/_singletons/context/resource-cache',
  null,
)
