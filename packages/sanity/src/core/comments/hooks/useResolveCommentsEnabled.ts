import {useMemo} from 'react'

import {useFeatureEnabled} from '../../hooks'
import {useSource} from '../../studio'
import {getPublishedId} from '../../util'
import {type CommentsUIMode} from '../types'

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
  const {enabled: featureEnabled, isLoading, error} = useFeatureEnabled('studioComments')

  const {enabled} = useSource().document.comments
  // Check if the feature is enabled for the current document in the config
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(documentId)}),
    [documentId, documentType, enabled],
  )

  const value: ResolveCommentsEnabled = useMemo(() => {
    // The feature is not enabled if:
    // - the feature is loading (`isLoading` is true)
    // - the feature is not enabled in the project (`enabledFromConfig` is false)
    // - there's an error when fetching the list of enabled features (`error` is set)
    if (isLoading || !enabledFromConfig || error) {
      return {enabled: false, mode: null}
    }

    return {
      enabled: true,
      mode: featureEnabled ? 'default' : 'upsell',
    }
  }, [isLoading, enabledFromConfig, error, featureEnabled])

  return value
}
