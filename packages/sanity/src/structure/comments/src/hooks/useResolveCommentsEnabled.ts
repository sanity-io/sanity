import {useMemo} from 'react'
import {getPublishedId, useFeatureEnabled, useSource} from 'sanity'

/**
 * @internal
 * A hook that resolves if comments are enabled for the current document and document type
 * and if the feature is enabled for the current project.
 */
export function useResolveCommentsEnabled(
  documentId: string,
  documentType: string,
): false | 'enabled' | 'read-only' {
  // Check if the projects plan has the feature enabled
  const {enabled: featureEnabled, isLoading} = useFeatureEnabled('studioComments')

  const {enabled} = useSource().document.unstable_comments
  // Check if the feature is enabled for the current document in the config
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(documentId)}),
    [documentId, documentType, enabled],
  )

  // If the feature is disabled to the project, because they are not in the correct plan we want to show the read-only view
  const featureStatus = featureEnabled ? 'enabled' : 'read-only'

  return !isLoading && enabledFromConfig ? featureStatus : false
}
