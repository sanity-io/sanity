import type {PerspectiveContextValue} from '../../core/perspective/types'
import {createContext} from 'sanity/_createContext'

/**
 *
 * @hidden
 * @beta
 */
export const PerspectiveContext = createContext<PerspectiveContextValue | null>(
  'sanity/_singletons/context/perspective-context',
  null,
)
