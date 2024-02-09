import React, {useMemo} from 'react'
import {useResolveCommentsEnabled} from '../../hooks'
import {CommentsEnabledContext} from './CommentsEnabledContext'
import {CommentsEnabledContextValue} from './types'
import {PermissionCheckResult} from 'sanity'

interface CommentsEnabledProviderProps {
  children: React.ReactNode
  documentId: string
  documentType: string
  permission: PermissionCheckResult | null | undefined
}

export const CommentsEnabledProvider = React.memo(function CommentsEnabledProvider(
  props: CommentsEnabledProviderProps,
) {
  const {children, documentId, documentType, permission} = props
  const value = useResolveCommentsEnabled(documentId, documentType)

  // If the user don't have granted permission to the document –
  // comments should not be enabled.
  const valueWithPermission = useMemo((): CommentsEnabledContextValue => {
    if (!permission?.granted) {
      return {enabled: false, mode: null}
    }

    return value
  }, [value, permission])

  return (
    <CommentsEnabledContext.Provider value={valueWithPermission}>
      {children}
    </CommentsEnabledContext.Provider>
  )
})
