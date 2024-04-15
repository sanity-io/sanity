import {createContext} from 'react'

import type {RouterContextValue} from '../../router/types'

/**
 * @internal
 */
export const RouterContext = createContext<RouterContextValue | null>(null)
