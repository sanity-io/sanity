import {createContext} from 'react'

import type {UserApplicationCache} from '../../core/store/userApplications/userApplicationCache'

/**
 * @internal
 */
export const UserApplicationCacheContext = createContext<UserApplicationCache | null>(null)
