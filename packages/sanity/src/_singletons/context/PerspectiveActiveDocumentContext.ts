import {createContext} from 'sanity/_createContext'

import type {PerspectiveActiveDocumentContextValue} from '../../core/perspective/activeDocument/types'

/**
 * @internal
 */
export const PerspectiveActiveDocumentContext =
  createContext<PerspectiveActiveDocumentContextValue | null>(
    'sanity/_singletons/context/perspective-active-document',
    null,
  )
