import type {PresentationContextValue} from '../../presentation/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresentationContext = createContext<PresentationContextValue | null>(
  'sanity/_singletons/context/presentation',
  null,
)
