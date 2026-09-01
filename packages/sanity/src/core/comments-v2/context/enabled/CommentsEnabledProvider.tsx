import {memo, type ReactNode} from 'react'
import {CommentsEnabledContextV2} from 'sanity/_singletons'

import {useResolveCommentsEnabled} from '../../hooks/useResolveCommentsEnabled'

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

  return (
    <CommentsEnabledContextV2.Provider value={value}>{children}</CommentsEnabledContextV2.Provider>
  )
})
