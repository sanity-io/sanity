import type {ResourceCache} from '../../core/store/_legacy/ResourceCacheProvider'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const ResourceCacheContext = createContext<ResourceCache | null>(
  'sanity/_singletons/context/resource-cache',
  null,
)
