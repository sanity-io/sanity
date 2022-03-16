import React from 'react'
import {RouterContextValue} from './types'

/**
 * @public
 */
export const RouterContext = React.createContext<RouterContextValue | null>(null)
