import {createContext} from 'react'

import {type RouterContextValue} from './types'

/**
 * @internal
 */
export const RouterContext = createContext<RouterContextValue | null>(null)
