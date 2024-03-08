import {createContext} from 'react'

import {type CommentsAuthoringPathContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsAuthoringPathContext = createContext<CommentsAuthoringPathContextValue | null>(
  null,
)
