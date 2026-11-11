import {useCallback, useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVariantStickyParams,
  isCardinalityOneRelease,
  isReleaseDocument,
  type SetVariant,
  type TargetPerspective,
  useGetDefaultPerspective,
  useSetPerspective,
  useSetVariant,
  useSingleDocRelease,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {usePaneRouter} from '../components/paneRouter/usePaneRouter'

interface PerspectiveNavigator {
  /**
   * Navigate to the provided perspective.
   */
  navigate: (perspective: TargetPerspective) => void
  /**
   * Select a variant, and the perspective when one is given. Closes the scheduled draft open in
   * this pane, which only holds a version of the variant it was opened for.
   */
  setVariant: SetVariant
}

/**
 * Navigate between perspectives.
 * Must be used within a pane context.
 *
 * @internal
 */
export function usePerspectiveNavigator(): PerspectiveNavigator {
  const setPerspective = useSetPerspective()
  const setGlobalVariant = useSetVariant()
  const router = useRouter()
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

  const setVariant = useCallback<SetVariant>(
    (options) => {
      if (!params?.scheduledDraft) {
        setGlobalVariant(options)
        return
      }

      const stickyParams = getVariantStickyParams(
        options,
        typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined,
        defaultPerspective,
      )
      // Same race as above: the pane param and the variant change in one navigation.
      // The router removes an empty sticky param, as it does a `null` one.
      setParams(
        {...params, scheduledDraft: undefined},
        Object.fromEntries(Object.entries(stickyParams).map(([key, value]) => [key, value ?? ''])),
      )
    },
    [defaultPerspective, params, router, setGlobalVariant, setParams],
  )

  return useMemo(() => ({navigate, setVariant}), [navigate, setVariant])
}
