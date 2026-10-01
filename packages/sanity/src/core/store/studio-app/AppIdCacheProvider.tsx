import {type ReactNode, use, useMemo} from 'react'
import {AppIdCacheContext} from 'sanity/_singletons'

import {type AppIdCache, createAppIdCache} from './appIdCache'

interface AppIdCacheProviderProps {
  children: ReactNode
}

/**
 * @internal
 */
export function AppIdCacheProvider(props: AppIdCacheProviderProps) {
  const {children} = props
  const parentCache = use(AppIdCacheContext)

  const cache = useMemo(() => parentCache || createAppIdCache(), [parentCache])

  return <AppIdCacheContext.Provider value={cache}>{children}</AppIdCacheContext.Provider>
}

/**
 * @internal
 */
export function useAppIdCache(): AppIdCache {
  const cache = use(AppIdCacheContext)

  if (!cache) {
    throw new Error(
      'AppIdCache: missing context value. Ensure the component is wrapped in a AppIdCacheProvider.',
    )
  }

  return cache
}
