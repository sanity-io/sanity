import {createContext} from 'react'

import type {Workspace} from '../../../core/config/types'

/**
 * @internal
 */
export const WorkspaceContext = createContext<Workspace | null>(null)
