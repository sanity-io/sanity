import {memo, type ReactNode} from 'react'
import {CommentsEnabledContextV2} from 'sanity/_singletons'

import {useResolveCommentsEnabled} from '../../hooks/useResolveCommentsEnabled'

interface CommentsEnabledProviderProps {
  children: ReactNode
  groupId: string
  documentType: string
}

/**
 * @beta
 * @hidden
 */
export const CommentsEnabledProvider = memo(function CommentsEnabledProvider(
  props: CommentsEnabledProviderProps,
) {
  const {children, groupId, documentType} = props

  const value = useResolveCommentsEnabled(groupId, documentType)

  return (
    <CommentsEnabledContextV2.Provider value={value}>{children}</CommentsEnabledContextV2.Provider>
  )
})
