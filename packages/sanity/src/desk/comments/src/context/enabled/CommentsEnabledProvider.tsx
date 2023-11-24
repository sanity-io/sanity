import React, {useMemo} from 'react'
import {CommentsEnabledContext} from './CommentsEnabledContext'
import {useFeatureEnabled, useSource, getPublishedId} from 'sanity'

interface CommentsEnabledProviderProps {
  children: React.ReactNode
  documentId: string
  documentType: string
}

export const CommentsEnabledProvider = React.memo(function CommentsEnabledProvider(
  props: CommentsEnabledProviderProps,
) {
  const {children, documentId, documentType} = props

  // Check if the projects plan has the feature enabled
  const {enabled: featureEnabled, isLoading} = useFeatureEnabled('studioComments')

  const {enabled} = useSource().document.unstable_comments

  // Check if the feature is enabled for the current document in the config
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(documentId)}),
    [documentId, documentType, enabled],
  )

  const isEnabled = useMemo((): boolean => {
    if (isLoading || !featureEnabled || !enabledFromConfig) return false
    return true
  }, [enabledFromConfig, featureEnabled, isLoading])

  return (
    <CommentsEnabledContext.Provider value={isEnabled}>{children}</CommentsEnabledContext.Provider>
  )
})
