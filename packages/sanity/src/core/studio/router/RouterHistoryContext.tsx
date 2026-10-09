import {type ReactNode, use} from 'react'
import {RouterHistoryContext} from 'sanity/_singletons'

import {type RouterHistory} from './types'

/** @internal */
export function RouterHistoryProvider({
  children,
  history,
}: {
  children: ReactNode
  history: RouterHistory
}) {
  return <RouterHistoryContext.Provider value={history}>{children}</RouterHistoryContext.Provider>
}

/** @internal */
export function useRouterHistory(): RouterHistory {
  const value = use(RouterHistoryContext)
  if (!value) throw new Error('Could not find `RouterHistoryProvider` context')
  return value
}
