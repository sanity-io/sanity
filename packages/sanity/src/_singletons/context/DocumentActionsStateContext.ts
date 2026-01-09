import {createContext} from 'sanity/_createContext'

import type {DocumentActionDescription} from '../../core/config/document/actions'

/**
 * @internal
 */
export const DocumentActionsStateContext = createContext<DocumentActionDescription[] | null>(
  'sanity/_singletons/context/actions-state',
  null,
)
