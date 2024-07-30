import {createContext} from 'sanity/_createContext'

import type {RouterContextValue} from '../../router/types'

/**
 * @internal
 */
export const RouterContext = createContext<RouterContextValue | null>(
  'sanity/_singletons/context/router',
  null,
)
