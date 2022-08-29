import React from 'react'
import {RouterContextValue} from './types'

/**
 * @internal
 */
export const RouterContext = React.createContext<RouterContextValue | null>(null)
