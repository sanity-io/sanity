import {createContext} from 'sanity/_createContext'

import type {RouterContextValue} from '../../router/types'

/**
 * @internal
 */
export const RouterContext: React.Context<RouterContextValue | null> =
  createContext<RouterContextValue | null>('sanity/_singletons/context/router', null)
