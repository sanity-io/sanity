import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {DocumentFieldAction} from '../../core/config/document/fieldActions/types'

/**
 * @internal
 */
export interface DocumentFieldActionsContextValue {
  actions: DocumentFieldAction[]
}

/**
 * @internal
 */
export const DocumentFieldActionsContext: Context<DocumentFieldActionsContextValue | null> =
  createContext<DocumentFieldActionsContextValue | null>(
    'sanity/_singletons/context/document-field-actions',
    null,
  )
