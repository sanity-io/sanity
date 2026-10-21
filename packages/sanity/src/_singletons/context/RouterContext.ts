import {createContext} from 'react'

import type {RouterContextValue} from '../../router/types'

/**
 * @hidden
 * @beta
 */
export const RouterContext = createContext<RouterContextValue | null>(null)
