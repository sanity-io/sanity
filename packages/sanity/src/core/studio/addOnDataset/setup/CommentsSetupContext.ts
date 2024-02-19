import {createContext} from 'react'

import {type CommentsSetupContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsSetupContext = createContext<CommentsSetupContextValue | null>(null)
