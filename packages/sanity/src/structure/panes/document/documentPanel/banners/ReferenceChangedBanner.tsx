import {CloseIcon} from '@sanity/icons/Close'
import {SyncIcon} from '@sanity/icons/Sync'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type Reference} from '@sanity/types'
import {Text} from '@sanity/ui'
import {fromString as pathFromString, get as pathGet} from '@sanity/util/paths'
import {type ComponentType, memo, useCallback, useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {concat, type Observable, of} from 'rxjs'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {
  getPublishedId,
  useDocumentStore,
  usePerspective,
  useTargetScopeId,
  useTranslation,
} from 'sanity'

import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {useResolvedPanesList} from '../../../../structureResolvers/useResolvedPanesList'
import {isDocumentPaneNode} from '../../../../utils'
import {Banner} from './Banner'

interface ParentReferenceInfo {
  loading: boolean
  result?: {
    available: boolean
    refValue: string | undefined
  }
}

const ReferenceChangedBannerComponent: ComponentType = () => {
  const documentStore = useDocumentStore()
  const {selectedPerspectiveName} = usePerspective()
  const {params, groupIndex, routerPanesState, replaceCurrent, BackLink} = usePaneRouter()
  const {paneDataItems} = useResolvedPanesList()
  const routerReferenceId = routerPanesState.at(groupIndex)?.at(0)?.id
  const parentPath = params?.parentRefPath ? pathFromString(params.parentRefPath) : null
  const {t} = useTranslation(structureLocaleNamespace)

  const parentPaneData = paneDataItems.find(
    (item) => item.groupIndex === groupIndex && item.siblingIndex === 0,
  )

  const parentPane = parentPaneData?.pane
  const parentId = parentPaneData?.itemId
  const parentGroupId = getPublishedId(parentId ?? '')

  const parentType =
    parentPane && isDocumentPaneNode(parentPane) ? parentPane.options.type : undefined

  const hasHistoryOpen = Boolean(parentPaneData?.params?.rev)

  const targetScopeId = useTargetScopeId({
    documentId: parentGroupId,
    selectedPerspectiveName,
  })

  /**
   * Watches the reference field of the parent pane. This is only applicable to
   * child references (aka references-in-place).
   *
   * It utilizes the pane ID of the parent pane (which is a document ID) along
   * with the `parentRefPath` router param on the current pane to find the
   * current value of the reference field on the parent document.
   *
   * This is used to compare with the current pane's document ID. If the IDs
   * don't match then this banner should reveal itself.
   */
  const parentReferenceInfoObservable = useMemo((): Observable<ParentReferenceInfo> => {
    // short-circuit: this document pane is not a child reference pane
    if (!parentId || !parentPath || !parentType) {
      return of({loading: false})
    }

    return concat(
      // emit a loading state instantly
      of({loading: true}),
      documentStore.pair.editState(parentGroupId, parentType, targetScopeId).pipe(
        map((editState): ParentReferenceInfo => {
          if (!editState.ready) {
            return {loading: true}
          }

          const parentDocument = editState.version ?? editState.draft ?? editState.published

          return {
            loading: false,
            result: {
              available: parentDocument !== null,
              refValue: pathGet<Reference>(parentDocument, parentPath)?._ref,
            },
          }
        }),
        distinctUntilChanged(
          (a, b) =>
            a.loading === b.loading &&
            a.result?.available === b.result?.available &&
            a.result?.refValue === b.result?.refValue,
        ),
      ),
    )
  }, [documentStore, parentGroupId, parentId, parentPath, parentType, targetScopeId])

  // Kept synchronous: `handleReloadReference` navigates to `refValue` from
  // this snapshot, so a deferred value could point the reload action at a
  // stale parent reference.
  const parentReferenceInfo = useSyncObservable(parentReferenceInfoObservable, {loading: true})

  const handleReloadReference = useCallback(() => {
    if (parentReferenceInfo.loading) return

    if (parentReferenceInfo.result?.refValue) {
      replaceCurrent({
        id: parentReferenceInfo.result.refValue,
        params: params as Record<string, string>,
      })
    }
  }, [parentReferenceInfo.loading, parentReferenceInfo.result, replaceCurrent, params])

  const shouldHide =
    // if `parentId` or `parentPath` is not present then this banner is n/a
    !parentId ||
    !parentPath ||
    !routerReferenceId ||
    // if viewing this pane via history, then hide
    hasHistoryOpen ||
    // if loading, hide
    parentReferenceInfo.loading ||
    // if the parent document is not available (e.g. due to permission denied or
    // not found) we don't want to display a warning here, but instead rely on the
    // parent view to display the appropriate message
    !parentReferenceInfo.result?.available ||
    // if the references are the same, then hide the reference changed banner
    parentReferenceInfo.result?.refValue === routerReferenceId

  if (shouldHide) return null

  return (
    <Banner
      action={
        parentReferenceInfo.result?.refValue
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
          {parentReferenceInfo.result?.refValue
            ? t('banners.reference-changed-banner.reason-changed.text')
            : t('banners.reference-changed-banner.reason-removed.text')}
        </Text>
      }
      icon={WarningOutlineIcon}
      tone="caution"
    />
  )
}

export const ReferenceChangedBanner = memo(ReferenceChangedBannerComponent)
