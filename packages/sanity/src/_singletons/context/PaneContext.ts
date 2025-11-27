import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {PaneContextValue} from '../../structure/components/pane/types'

/**
 * @internal
 */
export const PaneContext: Context<PaneContextValue | null> = createContext<PaneContextValue | null>(
  'sanity/_singletons/context/pane',
  null,
)
