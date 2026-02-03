import type {DocumentActionDescription} from '../../core/config/document/actions'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const DocumentActionsStateContext = createContext<DocumentActionDescription[] | null>(
  'sanity/_singletons/context/actions-state',
  null,
)
