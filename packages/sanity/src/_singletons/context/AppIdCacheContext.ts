import {createContext} from 'sanity/_createContext'

import type {AppIdCache} from '../../core/store/studio-app/appIdCache'

/**
 * @internal
 */
export const AppIdCacheContext = createContext<AppIdCache | null>(
  'sanity/_singletons/context/app-id-cache',
  null,
)
