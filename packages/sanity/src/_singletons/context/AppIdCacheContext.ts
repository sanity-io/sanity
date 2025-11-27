import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {AppIdCache} from '../../core/create/studio-app/appIdCache'

/**
 * @internal
 */
export const AppIdCacheContext: React.Context<AppIdCache | null> = createContext(
  'sanity/_singletons/context/app-id-cache',
  null,
)
