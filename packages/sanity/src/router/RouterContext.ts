import {createContext} from 'react'
import {RouterContextValue} from './types'

/**
 * @internal
 */
export const RouterContext = createContext<RouterContextValue | null>(null)
