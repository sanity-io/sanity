import {useMemo} from 'react'
import {CommentsEnabledContextValue} from '../context/enabled/types'
import {getPublishedId, useFeatureEnabled, useSource} from 'sanity'

/**
 * @internal
 * A hook that resolves if comments are enabled for the current document and document type
 * and if the feature is enabled for the current project.
 */
export function useResolveCommentsEnabled(
  documentId: string,
  documentType: string,
): CommentsEnabledContextValue {
  // Check if the projects plan has the feature enabled
  const {enabled: featureEnabled, isLoading} = useFeatureEnabled('studioComments')

  const {enabled} = useSource().document.unstable_comments
  // Check if the feature is enabled for the current document in the config
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(documentId)}),
    [documentId, documentType, enabled],
  )

  return {
    enabled: !isLoading && enabledFromConfig,
    // TODO: Restore
    // reason: featureEnabled ? null : 'upsell',
    reason: 'upsell',
  }
}
