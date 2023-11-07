import {createContext} from 'react'
import {CommentsSelectedPathContextValue} from './types'

export const CommentsSelectedPathContext = createContext<CommentsSelectedPathContextValue | null>(
  null,
)
