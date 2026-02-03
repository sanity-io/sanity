import type {RouterContextValue} from '../../router/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const RouterContext = createContext<RouterContextValue | null>(
  'sanity/_singletons/context/router',
  null,
)
