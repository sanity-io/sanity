import {useMemo} from 'react'
import {CommentsUIMode} from '../types'
import {getPublishedId, useFeatureEnabled, useSource} from 'sanity'

type ResolveCommentsEnabled =
  | {
      enabled: false
      mode: null
    }
  | {
      enabled: true
      mode: CommentsUIMode
    }

/**
 * @internal
 * A hook that resolves if comments are enabled for the current document and document type
 * and if the feature is enabled for the current project.
 */
export function useResolveCommentsEnabled(
  documentId: string,
  documentType: string,
): ResolveCommentsEnabled {
  // Check if the projects plan has the feature enabled
  const {enabled: featureEnabled, isLoading} = useFeatureEnabled('studioComments')

  const {enabled} = useSource().document.unstable_comments
  // Check if the feature is enabled for the current document in the config
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(documentId)}),
    [documentId, documentType, enabled],
  )

  const value: ResolveCommentsEnabled = useMemo(() => {
    if (isLoading || !enabledFromConfig) {
      return {enabled: false, mode: null}
    }

    return {
      enabled: true,
      // mode: featureEnabled ? 'default' : 'upsell',
      mode: 'upsell',
    }
  }, [isLoading, enabledFromConfig])

  return value
}
