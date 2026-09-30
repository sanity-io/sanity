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
  const featuresPromise = use(CommentsFeaturesPromiseContextV2)
  // Unlike the studio layout, this runs from the document layout middleware, which also mounts in
  // studios composed without `StudioLayout` — there no `CommentsStudioProvider` ran. The check
  // itself never rejects, so a rejected promise only ever means that missing provider: comments
  // are off there instead of the document failing to render.
  const features = featuresPromise.status === 'rejected' ? null : use(featuresPromise)

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {enabled} = useSource().document.comments
  // Check if the feature is enabled for the current document in the config
  const enabledFromConfig = useMemo(
    () => enabled({documentType, documentId: getPublishedId(groupId)}),
    [groupId, documentType, enabled],
  )

  const value: ResolveCommentsEnabled = useMemo(() => {
    // The feature is not enabled if:
    // - there is no feature check to read (`features` is null)
    // - the feature is not enabled in the project (`enabledFromConfig` is false)
    // - there's an error when fetching the list of enabled features (`features.error` is set)
    if (!features || !enabledFromConfig || features.error) {
      return {enabled: false, mode: null}
    }

    return {
      enabled: true,
      mode: features.enabled ? 'default' : 'upsell',
    }
  }, [enabledFromConfig, features])

  return value
}
