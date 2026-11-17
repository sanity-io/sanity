import {createContext} from 'react'

import type {UserApplication} from '../../core/store/userApplications'

/**
 * @hidden
 * @internal
 */
export type LiveUserApplicationContextValue = {
  userApplication: UserApplication | undefined
  isLoading: boolean
}
/**
 *
 * @hidden
 * @internal
 */
export const LiveUserApplicationContext = createContext<LiveUserApplicationContextValue>({
  userApplication: undefined,
  isLoading: true,
})
