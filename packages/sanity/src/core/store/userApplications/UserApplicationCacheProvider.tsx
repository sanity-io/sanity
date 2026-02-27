import {type ReactNode, useContext, useMemo} from 'react'
import {UserApplicationCacheContext} from 'sanity/_singletons'

import {createUserApplicationCache, type UserApplicationCache} from './userApplicationCache'

interface UserApplicationCacheProviderProps {
  children: ReactNode
}

/**
 * Provider that creates and provides a cache for user applications.
 * The cache is shared across all consumers to avoid duplicate API fetches.
 * @internal
 */
export function UserApplicationCacheProvider({children}: UserApplicationCacheProviderProps) {
  const parentCache = useContext(UserApplicationCacheContext)

  const cache = useMemo(() => parentCache || createUserApplicationCache(), [parentCache])

  return (
    <UserApplicationCacheContext.Provider value={cache}>
      {children}
    </UserApplicationCacheContext.Provider>
  )
}

/**
 * Hook to access the user applications cache.
 * @internal
 */
export function useUserApplicationCache(): UserApplicationCache {
  const cache = useContext(UserApplicationCacheContext)

  if (!cache) {
    throw new Error(
      'UserApplicationCache: missing context value. Ensure the component is wrapped in a UserApplicationCacheProvider.',
    )
  }

  return cache
}
