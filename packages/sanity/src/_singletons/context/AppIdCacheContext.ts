import {createContext} from 'react'

import type {AppIdCache} from '../../core/store/studio-app/appIdCache'

/**
 * @internal
 */
export const AppIdCacheContext = createContext<AppIdCache | null>(null)
