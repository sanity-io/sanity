import React, {createContext, useContext, useMemo} from 'react'
import {createMultiKeyWeakMap, MultiKeyWeakMap} from './createMultiKeyWeakMap'

interface ResourceCache {
  get<T = unknown>(options: {namespace: string; dependencies: object[]}): T | undefined
  set(options: {namespace: string; dependencies: object[]; value: unknown}): void
}

const ResourceCacheContext = createContext<ResourceCache | null>(null)

interface CacheProviderProps {
  children: React.ReactNode
}

export function ResourceCacheProvider({children}: CacheProviderProps) {
  const resourceCache = useMemo((): ResourceCache => {
    const namespaces = new Map<string, MultiKeyWeakMap>()
    return {
      get: ({namespace, dependencies}) => {
        const namespaceMap = namespaces.get(namespace)
        return namespaceMap?.get(dependencies)
      },

      set: ({namespace, dependencies, value}) => {
        const namespaceMap = namespaces.get(namespace) || createMultiKeyWeakMap()
        namespaces.set(namespace, namespaceMap)
        namespaceMap.set(dependencies, value)
      },
    }
  }, [])

  return (
    <ResourceCacheContext.Provider value={resourceCache}>{children}</ResourceCacheContext.Provider>
  )
}

export function useResourceCache() {
  const cache = useContext(ResourceCacheContext)
  if (!cache) throw new Error('Could not find `cache` context')
  return cache
}
