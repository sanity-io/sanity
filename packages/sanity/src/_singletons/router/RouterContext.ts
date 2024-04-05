import {createContext} from 'react'
import type {RouterContextValue} from 'sanity/router'

/**
 * @internal
 */
export const RouterContext = createContext<RouterContextValue | null>(null)
