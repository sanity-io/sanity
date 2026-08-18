import {useCallback, useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  isCardinalityOneRelease,
  isReleaseDocument,
  type TargetPerspective,
  useGetDefaultPerspective,
  useSetPerspective,
  useSingleDocRelease,
} from 'sanity'

import {usePaneRouter} from '../components/paneRouter/usePaneRouter'

interface PerspectiveNavigator {
  /**
   * Navigate to the provided perspective.
   */
  navigate: (perspective: TargetPerspective) => void
}

/**
 * Navigate between perspectives.
 * Must be used within a pane context.
 *
 * @internal
 */
export function usePerspectiveNavigator(): PerspectiveNavigator {
  const setPerspective = useSetPerspective()
  const {params, setParams} = usePaneRouter()
  const defaultPerspective = useGetDefaultPerspective()
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()

  const navigate = useCallback(
    (perspective: TargetPerspective) => {
      if (isReleaseDocument(perspective) && isCardinalityOneRelease(perspective)) {
        onSetScheduledDraftPerspective(getReleaseIdFromReleaseDocumentId(perspective._id))
        return
      }

      if (perspective === 'published' && params?.historyVersion) {
        setParams({
          ...params,
          rev: params?.historyEvent || undefined,
          since: undefined,
          historyVersion: undefined,
        })
      }

      const newPerspective = isReleaseDocument(perspective)
        ? getReleaseIdFromReleaseDocumentId(perspective._id)
        : perspective === defaultPerspective
          ? ''
          : perspective

      if (params?.scheduledDraft) {
        setParams(
          {...params, scheduledDraft: undefined},
          // If we have a scheduled draft perspective, then we need to remove that one and set the new perspective.
          // We cannot do it in two passes, for example first set the paneParam and the use the `setPerspective`
          // because we will have a race condition in where the last state wins, but the last state won't have the previous change.
          // So we change the params and perspective in the same call.
          {perspective: newPerspective},
        )

        return
      }

      setPerspective(newPerspective)
    },
    [setPerspective, setParams, params, defaultPerspective, onSetScheduledDraftPerspective],
  )

  return useMemo(() => ({navigate}), [navigate])
}
