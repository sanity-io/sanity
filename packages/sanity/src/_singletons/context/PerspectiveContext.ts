import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {PerspectiveContextValue} from '../../core/perspective/types'

/**
 *
 * @hidden
 * @beta
 */
export const PerspectiveContext: Context<PerspectiveContextValue | null> =
  createContext<PerspectiveContextValue | null>(
    'sanity/_singletons/context/perspective-context',
    null,
  )
