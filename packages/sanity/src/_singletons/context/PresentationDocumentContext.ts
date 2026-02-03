import type {PresentationDocumentContextValue} from '../../presentation/document/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresentationDocumentContext = createContext<PresentationDocumentContextValue | null>(
  'sanity/_singletons/context/presentation/document',
  null,
)
