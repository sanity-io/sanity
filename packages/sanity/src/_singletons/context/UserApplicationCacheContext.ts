import type {UserApplicationCache} from '../../core/store/userApplications/userApplicationCache'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const UserApplicationCacheContext = createContext<UserApplicationCache | null>(
  'sanity/_singletons/context/user-application-cache',
  null,
)
