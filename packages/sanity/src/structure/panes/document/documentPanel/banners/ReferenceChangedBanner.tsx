import {CloseIcon, SyncIcon, WarningOutlineIcon} from '@sanity/icons'
import {type KeyedSegment, type Reference} from '@sanity/types'
import {Text} from '@sanity/ui'
import {fromString as pathFromString, get as pathGet} from '@sanity/util/paths'
import {memo, useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {concat, type Observable, of} from 'rxjs'
import {debounceTime, map} from 'rxjs/operators'
import {
  type DocumentAvailability,
  getPublishedId,
  useDocumentPreviewStore,
  usePerspective,
  useTranslation,
} from 'sanity'

import {usePaneRouter} from '../../../../components'
import {structureLocaleNamespace} from '../../../../i18n'
import {type RouterPaneGroup} from '../../../../types'
import {Banner} from './Banner'

interface ParentReferenceInfo {
  loading: boolean
  result?: {
    availability: {
      draft: DocumentAvailability
      published: DocumentAvailability
      version?: DocumentAvailability
    }
    refValue: string | undefined
  }
}

export const ReferenceChangedBanner = memo(() => {
  const documentPreviewStore = useDocumentPreviewStore()
  const {selectedReleaseId} = usePerspective()
  const {params, groupIndex, routerPanesState, replaceCurrent, BackLink} = usePaneRouter()
  const routerReferenceId = routerPanesState[groupIndex]?.[0].id
  const parentGroup = routerPanesState[groupIndex - 1] as RouterPaneGroup | undefined
  const parentSibling = parentGroup?.[0]
  const parentId = parentSibling?.id
  const hasHistoryOpen = Boolean(parentSibling?.params?.rev)
  const parentRefPath = useMemo(() => {
    return (params?.parentRefPath && pathFromString(params.parentRefPath)) || null
  }, [params?.parentRefPath])
  const {t} = useTranslation(structureLocaleNamespace)

  /**
   * Loads information regarding the reference field of the parent pane. This
   * is only applicable to child references (aka references-in-place).
   *
   * It utilizes the pane ID of the parent pane (which is a document ID) along
   * with the `parentRefPath` router param on the current pane to find the
   * current value of the reference field on the parent document.
   *
   * This is used to compare with the current pane's document ID. If the IDs
   * don't match then this banner should reveal itself
   */
  const referenceInfoObservable = useMemo((): Observable<ParentReferenceInfo> => {
    const parentRefPathSegment = parentRefPath?.[0] as string | undefined

    // short-circuit: this document pane is not a child reference pane
    if (!parentId || !parentRefPathSegment || !parentRefPath) {
      return of({loading: false})
    }

    const publishedId = getPublishedId(parentId)
    const path = pathFromString(parentRefPathSegment)

    // note: observePaths doesn't support keyed path segments, so we need to select the nearest parent
    const keyedSegmentIndex = path.findIndex(
      (p): p is KeyedSegment => typeof p == 'object' && '_key' in p,
    )

    return concat(
      // emit a loading state instantly
      of({loading: true}),
      // then emit the values from watching the published ID's path
      documentPreviewStore
        .unstable_observePathsDocumentPair(
          publishedId,
          (keyedSegmentIndex === -1 ? path : path.slice(0, keyedSegmentIndex)) as string[][],
          {
            version: selectedReleaseId,
          },
        )
        .pipe(
          // this debounce time is needed to prevent flashing banners due to
          // the router state updating faster than the content-lake state. we
          // debounce to wait for more emissions because the value pulled
          // initially could be stale.
          debounceTime(750),
          map(
            ({draft, published, version}): ParentReferenceInfo => ({
              loading: false,
              result: {
                availability: {
                  draft: draft.availability,
                  published: published.availability,
                  ...(version?.availability
                    ? {
                        version: version.availability,
                      }
                    : {}),
                },
                refValue: pathGet<Reference>(
                  version?.snapshot || draft.snapshot || published.snapshot,
                  parentRefPath,
                )?._ref,
              },
            }),
          ),
        ),
    )
  }, [selectedReleaseId, documentPreviewStore, parentId, parentRefPath])
  const referenceInfo = useObservable(referenceInfoObservable, {loading: true})

  const handleReloadReference = useCallback(() => {
    if (referenceInfo.loading) return

    if (referenceInfo.result?.refValue) {
      replaceCurrent({
        id: referenceInfo.result.refValue,
        params: params as Record<string, string>,
      })
    }
  }, [referenceInfo.loading, referenceInfo.result, replaceCurrent, params])

  const shouldHide =
    // if `parentId` or `parentRefPath` is not present then this banner is n/a
    !parentId ||
    !parentRefPath ||
    // if viewing this pane via history, then hide
    hasHistoryOpen ||
    // if loading, hide
    referenceInfo.loading ||
    // if the parent document is not available (e.g. due to permission denied or
    // not found) we don't want to display a warning here, but instead rely on the
    // parent view to display the appropriate message
    (!referenceInfo.result?.availability.draft.available &&
      !referenceInfo.result?.availability.published.available) ||
    // if the references are the same, then hide the reference changed banner
    referenceInfo.result?.refValue === routerReferenceId

  if (shouldHide) return null

  return (
    <Banner
      action={
        referenceInfo.result?.refValue
          ? {
              onClick: handleReloadReference,
              icon: SyncIcon,
              text: t('banners.reference-changed-banner.reason-changed.reload-button.text'),
            }
          : {
              as: BackLink,
              icon: CloseIcon,
              text: t('banners.reference-changed-banner.reason-removed.close-button.text'),
            }
      }
      data-testid="reference-changed-banner"
      content={
        <Text size={1} weight="medium">
          {referenceInfo.result?.refValue
            ? t('banners.reference-changed-banner.reason-changed.text')
            : t('banners.reference-changed-banner.reason-removed.text')}
        </Text>
      }
      icon={WarningOutlineIcon}
      tone="caution"
    />
  )
})

ReferenceChangedBanner.displayName = 'Memo(ReferenceChangedBanner)'
