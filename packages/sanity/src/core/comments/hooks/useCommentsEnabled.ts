import {useMemo} from 'react'
import {useFeatureEnabled} from '../../hooks'
import {useSource} from '../../studio'
import {getPublishedId} from '../../util'

interface Enabled {
  isEnabled: false
  reason: 'disabled-by-config' | 'plan-upgrade-required'
}

interface Disabled {
  isEnabled: true
  reason: null
}

type CommentsEnabled = Enabled | Disabled

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
    if (!featureEnabled && !isLoading) {
      return {
        isEnabled: false,
        reason: 'plan-upgrade-required',
      } satisfies CommentsEnabled
    }

    if (!enabledFromConfig || isLoading) {
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
