import {createContext} from 'sanity/_createContext'

import type {PresentationDisplayedDocumentContextValue} from '../../presentation/loader/types'

/**
 * @internal
 */
export const PresentationDisplayedDocumentContext =
  createContext<PresentationDisplayedDocumentContextValue | null>(
    'sanity/_singletons/context/presentation/displayed-document',
    null,
  )
