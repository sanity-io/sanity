import {createContext} from 'react'
import {CommentsSelectedPathContextValue} from './types'

/** @internal */
export const CommentsSelectedPathContext = createContext<CommentsSelectedPathContextValue | null>(
  null,
)
