import React from 'react'
import {CommentsClientContext} from './CommentsClientContext'

interface CommentsClientProviderProps {
  children: React.ReactNode
}

/**
 * @beta
 * @hidden
 */
export function CommentsClientProvider(props: CommentsClientProviderProps) {
  const {children} = props

  return <CommentsClientContext.Provider value={null}>{children}</CommentsClientContext.Provider>
}
