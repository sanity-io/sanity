import type {PresentationNavigateContextValue} from '../../presentation/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresentationNavigateContext = createContext<PresentationNavigateContextValue | null>(
  'sanity/_singletons/context/presentation/navigate',
  null,
)
