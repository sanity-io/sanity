import * as React from 'react'

import {useResolveCommentsEnabled} from '../../hooks'
import {CommentsEnabledContext} from './CommentsEnabledContext'

interface CommentsEnabledProviderProps {
  children: React.ReactNode
  documentId: string
  documentType: string
}

export const CommentsEnabledProvider = React.memo(function CommentsEnabledProvider(
  props: CommentsEnabledProviderProps,
) {
  const {children, documentId, documentType} = props

  const value = useResolveCommentsEnabled(documentId, documentType)

  return <CommentsEnabledContext.Provider value={value}>{children}</CommentsEnabledContext.Provider>
})
