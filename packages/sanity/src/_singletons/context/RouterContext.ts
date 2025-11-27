import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {RouterContextValue} from '../../router/types'

/**
 * @internal
 */
export const RouterContext: Context<RouterContextValue | null> =
  createContext<RouterContextValue | null>('sanity/_singletons/context/router', null)
