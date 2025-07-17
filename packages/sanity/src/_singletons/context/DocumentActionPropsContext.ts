import {createContext} from 'sanity/_createContext'

import type {DocumentActionProps} from '../../core/config/document/actions'

/**
 * @internal
 */
export const DocumentActionPropsContext: React.Context<DocumentActionProps | undefined> =
  createContext<DocumentActionProps | undefined>(
    'sanity/_singletons/context/document-action-props',
    undefined,
  )
