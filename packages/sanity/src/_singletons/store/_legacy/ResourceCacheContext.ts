import {createContext} from 'react'
import type {ResourceCache} from 'sanity'

/**
 * @internal
 */
export const ResourceCacheContext = createContext<ResourceCache | null>(null)
