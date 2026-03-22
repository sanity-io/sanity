import {type ReactNode, useContext, useMemo} from 'react'
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
  const parentCache = useContext(AppIdCacheContext)

  const cache = useMemo(() => parentCache || createAppIdCache(), [parentCache])

  return <AppIdCacheContext.Provider value={cache}>{children}</AppIdCacheContext.Provider>
}

/**
 * @internal
 */
export function useAppIdCache(): AppIdCache {
  const cache = useContext(AppIdCacheContext)

  if (!cache) {
    throw new Error(
      'AppIdCache: missing context value. Ensure the component is wrapped in a AppIdCacheProvider.',
    )
  }

  return cache
}
