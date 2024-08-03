import {createContext} from 'react'

import type {RouterHistory} from '../../../../core/studio/router'

/**
 * Internal use only. Userland should leverage the public `useRouter` APIs.
 * @internal
 */
export const RouterHistoryContext = createContext<RouterHistory | null>(null)
