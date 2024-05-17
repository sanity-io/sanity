import {memo, type ReactNode} from 'react'
import {CommentsEnabledContext} from 'sanity/_singletons'

import {useResolveCommentsEnabled} from '../../hooks'

interface CommentsEnabledProviderProps {
  children: ReactNode
  documentId: string
  documentType: string
}

/**
 * @beta
 * @hidden
 */
export const CommentsEnabledProvider = memo(function CommentsEnabledProvider(
  props: CommentsEnabledProviderProps,
) {
  const {children, documentId, documentType} = props

  const value = useResolveCommentsEnabled(documentId, documentType)

  return <CommentsEnabledContext.Provider value={value}>{children}</CommentsEnabledContext.Provider>
})
