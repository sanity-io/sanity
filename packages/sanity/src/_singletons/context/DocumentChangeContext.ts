import {createContext} from 'sanity/_createContext'

import type {DocumentChangeContextInstance} from '../../core/field/diff/contexts/DocumentChangeContext'

/** @internal */
export const DocumentChangeContext = createContext<DocumentChangeContextInstance | null>(
  'sanity/_singletons/context/document-change',
  null,
)
