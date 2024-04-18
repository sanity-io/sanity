import {createContext} from 'react'

import {type CommentsUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsUpsellContext = createContext<CommentsUpsellContextValue | null>(null)
