import type {PresentationPanelsContextValue} from '../../presentation/panels/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresentationPanelsContext = createContext<PresentationPanelsContextValue | null>(
  'sanity/_singletons/context/presentation/panels',
  null,
)
