import type {PresentationDisplayedDocumentContextValue} from '../../presentation/loader/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresentationDisplayedDocumentContext =
  createContext<PresentationDisplayedDocumentContextValue | null>(
    'sanity/_singletons/context/presentation/displayed-document',
    null,
  )
