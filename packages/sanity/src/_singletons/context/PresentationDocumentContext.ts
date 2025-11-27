import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {PresentationDocumentContextValue} from '../../presentation/document/types'

/**
 * @internal
 */
export const PresentationDocumentContext: Context<PresentationDocumentContextValue | null> =
  createContext<PresentationDocumentContextValue | null>(
    'sanity/_singletons/context/presentation/document',
    null,
  )
