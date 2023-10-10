import {useMemo} from 'react'
import {getPublishedId, useFeatureEnabled, useSource} from 'sanity'

interface Disabled {
  isEnabled: false
  reason: 'disabled-by-config' | 'plan-upgrade-required' | 'loading'
}

interface Enabled {
  isEnabled: true
  reason: null
}

interface Loading {
  isEnabled: false
  reason: 'loading'
}

type CommentsEnabled = Enabled | Disabled | Loading

interface CommentsEnabledHookOptions {
  documentId: string
  documentType: string
}

/**
 * @internal
 */
export function useCommentsEnabled(opts: CommentsEnabledHookOptions): CommentsEnabled {
  const {documentId, documentType} = opts

  // 1. Plan check
  const {enabled: featureEnabled, isLoading} = useFeatureEnabled('studioComments')

  // 2. Config check
  const {enabled} = useSource().document.unstable_comments
  const enabledFromConfig = enabled({documentType, documentId: getPublishedId(documentId)})

  const commentsEnabled = useMemo(() => {
    if (isLoading) {
      return {
        isEnabled: false,
        reason: 'loading',
      } satisfies CommentsEnabled
    }

    if (!featureEnabled) {
      return {
        isEnabled: false,
        reason: 'plan-upgrade-required',
      } satisfies CommentsEnabled
    }

    if (!enabledFromConfig) {
      return {
        isEnabled: false,
        reason: 'disabled-by-config',
      } satisfies CommentsEnabled
    }

    return {
      isEnabled: true,
      reason: null,
    } satisfies CommentsEnabled
  }, [enabledFromConfig, featureEnabled, isLoading])

  return commentsEnabled
}
