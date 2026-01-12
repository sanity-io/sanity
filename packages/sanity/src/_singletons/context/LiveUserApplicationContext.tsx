import {createContext} from 'sanity/_createContext'

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
export const LiveUserApplicationContext = createContext<LiveUserApplicationContextValue>(
  'sanity/_singletons/context/live-user-application',
  {
    userApplication: undefined,
    isLoading: true,
  },
)
