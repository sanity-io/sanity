import {createContext} from 'sanity/_createContext'

import type {PresentationDocumentContextValue} from '../../presentation/document/types'

/**
 * @internal
 */
export const PresentationDocumentContext = createContext<PresentationDocumentContextValue | null>(
  'sanity/_singletons/context/presentation/document',
  null,
)
