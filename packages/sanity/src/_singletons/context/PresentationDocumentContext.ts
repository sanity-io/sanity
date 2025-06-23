import {createContext} from 'sanity/_createContext'

import type {PresentationDocumentContextValue} from '../../presentation/document/types'

/**
 * @internal
 */
export const PresentationDocumentContext: React.Context<PresentationDocumentContextValue | null> =
  createContext<PresentationDocumentContextValue | null>(
    'sanity/_singletons/context/presentation/document',
    null,
  )
