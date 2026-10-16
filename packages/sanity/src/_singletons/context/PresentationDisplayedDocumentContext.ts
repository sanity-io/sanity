import {createContext} from 'react'

import type {PresentationDisplayedDocumentContextValue} from '../../presentation/loader/types'

/**
 * @internal
 */
export const PresentationDisplayedDocumentContext =
  createContext<PresentationDisplayedDocumentContextValue | null>(null)
