import type {RouterHistory} from '../../core/studio/router'
import {createContext} from 'sanity/_createContext'

/**
 * Internal use only. Userland should leverage the public `useRouter` APIs.
 * @internal
 */
export const RouterHistoryContext = createContext<RouterHistory | null>(
  'sanity/_singletons/context/router-history',
  null,
)
