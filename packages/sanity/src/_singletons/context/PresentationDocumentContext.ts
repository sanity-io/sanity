import {createContext} from 'react'

import type {PresentationDocumentContextValue} from '../../presentation/document/types'

/**
 * @internal
 */
export const PresentationDocumentContext = createContext<PresentationDocumentContextValue | null>(
  null,
)
