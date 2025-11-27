import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {PresentationDisplayedDocumentContextValue} from '../../presentation/loader/types'

/**
 * @internal
 */
export const PresentationDisplayedDocumentContext: Context<PresentationDisplayedDocumentContextValue | null> =
  createContext<PresentationDisplayedDocumentContextValue | null>(
    'sanity/_singletons/context/presentation/displayed-document',
    null,
  )
