import type {AppIdCache} from '../../core/create/studio-app/appIdCache'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const AppIdCacheContext = createContext<AppIdCache | null>(
  'sanity/_singletons/context/app-id-cache',
  null,
)
