import {useContext} from 'react'

import {CommentsSelectedPathContext} from '../context/selected-path/CommentsSelectedPathContext'
import {type CommentsSelectedPathContextValue} from '../context/selected-path/types'

export function useCommentsSelectedPath(): CommentsSelectedPathContextValue {
  const ctx = useContext(CommentsSelectedPathContext)

  if (!ctx) {
    throw new Error('useCommentsSelectedPath: missing context value')
  }

  return ctx
}
