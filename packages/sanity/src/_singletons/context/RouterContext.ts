import {createContext} from 'sanity/_createContext'

import type {RouterContextValue} from '../../router/types'

/**
 * @hidden
 * @beta
 */
export const RouterContext = createContext<RouterContextValue | null>(
  'sanity/_singletons/context/router',
  null,
)
