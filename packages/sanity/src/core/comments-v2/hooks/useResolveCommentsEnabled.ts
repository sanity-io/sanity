import {use, useMemo} from 'react'
import {CommentsFeaturesPromiseContextV2} from 'sanity/_singletons'

import {useSource} from '../../studio/source'
import {getPublishedId} from '../../util/draftUtils'
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
  groupId: string,
  documentType: string,
): ResolveCommentsEnabled {
  // Whether the project's plan has the feature, as settled by `CommentsStudioProvider` above the
  // studio's loading screen. Read synchronously by the time a document opens, so the comments UI
  // is in its final state on the document's first paint instead of a pass later.
  const {enabled: featureEnabled, error} = use(use(CommentsFeaturesPromiseContextV2))

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {enabled} = useSource().document.comments
  // Check if the feature is enabled for the current document in the config
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(groupId)}),
    [groupId, documentType, enabled],
  )

  const value: ResolveCommentsEnabled = useMemo(() => {
    // The feature is not enabled if:
    // - the feature is not enabled in the project (`enabledFromConfig` is false)
    // - there's an error when fetching the list of enabled features (`error` is set)
    if (!enabledFromConfig || error) {
      return {enabled: false, mode: null}
    }

    return {
      enabled: true,
      mode: featureEnabled ? 'default' : 'upsell',
    }
  }, [enabledFromConfig, error, featureEnabled])

  return value
}
