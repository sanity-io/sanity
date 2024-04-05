import {type ReactNode, useContext, useMemo} from 'react'
import {ResourceCacheContext} from 'sanity/_singletons'

import {createMultiKeyWeakMap, type MultiKeyWeakMap} from './createMultiKeyWeakMap'

/** @internal */
export interface ResourceCache {
  get<T = unknown>(options: {namespace: string; dependencies: (object | null)[]}): T | undefined
  set(options: {namespace: string; dependencies: (object | null)[]; value: unknown}): void
}

/** @internal */
export interface ResourceCacheProviderProps {
  children: ReactNode
}

/** @internal */
export function ResourceCacheProvider({children}: ResourceCacheProviderProps) {
  const resourceCache = useMemo((): ResourceCache => {
    const namespaces = new Map<string, MultiKeyWeakMap>()

    // this is used to replace the `null` values in any `dependencies` so that
    // they can be used in the `MultiKeyWeakMap` which doesn't accept null
    const nullReplacer = {}

    return {
      get: ({namespace, dependencies}) => {
        const dependenciesWithoutNull = dependencies.map((dep) =>
          dep === null ? nullReplacer : dep,
        )
        const namespaceMap = namespaces.get(namespace)
        return namespaceMap?.get(dependenciesWithoutNull)
      },

      set: ({namespace, dependencies, value}) => {
        const namespaceMap = namespaces.get(namespace) || createMultiKeyWeakMap()
        const dependenciesWithoutNull = dependencies.map((dep) =>
          dep === null ? nullReplacer : dep,
        )
        namespaces.set(namespace, namespaceMap)
        namespaceMap.set(dependenciesWithoutNull, value)
      },
    }
  }, [])

  return (
    <ResourceCacheContext.Provider value={resourceCache}>{children}</ResourceCacheContext.Provider>
  )
}

/** @internal */
export function useResourceCache(): ResourceCache {
  const cache = useContext(ResourceCacheContext)
  if (!cache) throw new Error('Could not find `cache` context')
  return cache
}
