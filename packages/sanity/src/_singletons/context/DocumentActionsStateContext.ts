import {createContext} from 'react'

import type {DocumentActionDescription} from '../../core/config/document/actions'

/**
 * @internal
 */
export const DocumentActionsStateContext = createContext<DocumentActionDescription[] | null>(null)
