import {createContext} from 'react'

import type {DocumentActionProps} from '../../../core/config/document/actions'

/**
 * @internal
 */
export const DocumentActionPropsContext = createContext<DocumentActionProps | undefined>(undefined)
