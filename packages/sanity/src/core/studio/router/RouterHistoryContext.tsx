import React, {createContext, useContext} from 'react'
import type {RouterHistory} from './types'

/**
 * Internal use only. Userland should leverage the public `useRouter` APIs.
 * @internal
 */
const RouterHistoryContext = createContext<RouterHistory | null>(null)

/** @internal */
export function RouterHistoryProvider({
  children,
  history,
}: {
  children: React.ReactNode
  history: RouterHistory
}) {
  return <RouterHistoryContext.Provider value={history}>{children}</RouterHistoryContext.Provider>
}

/** @internal */
export function useRouterHistory(): RouterHistory {
  const value = useContext(RouterHistoryContext)
  if (!value) throw new Error('Could not find `RouterHistoryProvider` context')
  return value
}
