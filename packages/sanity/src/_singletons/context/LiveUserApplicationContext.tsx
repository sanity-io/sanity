import type {UserApplication} from '../../core/store/userApplications'
import {createContext} from 'sanity/_createContext'

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
