import {createContext} from 'react'

import type {PerspectiveContextValue} from '../../core/perspective/types'

/**
 *
 * @hidden
 * @beta
 */
export const PerspectiveContext = createContext<PerspectiveContextValue | null>(null)
