import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {DocumentChangeContextInstance} from '../../core/field/diff/contexts/DocumentChangeContext'

/** @internal */
export const DocumentChangeContext: Context<DocumentChangeContextInstance | null> =
  createContext<DocumentChangeContextInstance | null>(
    'sanity/_singletons/context/document-change',
    null,
  )
