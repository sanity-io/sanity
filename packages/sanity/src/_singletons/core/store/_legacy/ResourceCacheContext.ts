import {createContext} from 'react'

import type {ResourceCache} from '../../../../core/store/_legacy/ResourceCacheProvider'

/**
 * @internal
 */
export const ResourceCacheContext = createContext<ResourceCache | null>(null)
