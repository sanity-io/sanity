import type {History, BrowserHistory, MemoryHistory, HashHistory} from 'history'

export interface RouterStateEvent {
  type: 'state'
  searchParams: Record<string, string | undefined>
  state: Record<string, unknown> // | null
  isNotFound: boolean
}

export interface RouterIntentEvent {
  type: 'intent'
  intent: {name: string; params: Record<string, unknown>}
  isNotFound: boolean
}

export type RouterEvent = RouterStateEvent | RouterIntentEvent

/**
 * A subset of the History API is used, and explicitly declared so it's possible to write a custom
 * history implementation that can be used to integrate the router in a variety of parent routers.
 * @internal
 */
export type RequiredHistory = Pick<History, 'listen' | 'location' | 'push' | 'replace'>

/**
 * The history context is either one of the implementations from the `history` package, or a custom one that only implements
 * the subset of the History API that is used by the router, documented in `RequiredHistory`.
 * @internal
 */
export type RouterHistory = BrowserHistory | MemoryHistory | HashHistory | RequiredHistory
