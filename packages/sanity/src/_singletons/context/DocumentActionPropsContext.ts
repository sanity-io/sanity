import type {DocumentActionProps} from '../../core/config/document/actions'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const DocumentActionPropsContext = createContext<DocumentActionProps | undefined>(
  'sanity/_singletons/context/document-action-props',
  undefined,
)
