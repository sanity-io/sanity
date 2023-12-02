import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {WarningOutlineIcon, SyncIcon, CloseIcon} from '@sanity/icons'
import React, {memo, useCallback, useMemo} from 'react'
import styled from 'styled-components'
import {fromString as pathFromString, get as pathGet} from '@sanity/util/paths'
import {KeyedSegment, Reference} from '@sanity/types'
import {debounceTime, map} from 'rxjs/operators'
import {concat, Observable, of} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {RouterPaneGroup} from '../../../types'
import {usePaneRouter} from '../../../components'
import {Button} from '../../../../ui'
import {structureLocaleNamespace} from '../../../i18n'
import {DocumentAvailability, useDocumentPreviewStore, getPublishedId, useTranslation} from 'sanity'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

const TextOneLine = styled(Text)`
  & > * {
    overflow: hidden;
    overflow: clip;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`

interface ParentReferenceInfo {
  loading: boolean
  result?: {
    availability: {draft: DocumentAvailability; published: DocumentAvailability}
    refValue: string | undefined
  }
}

export const ReferenceChangedBanner = memo(() => {
  const documentPreviewStore = useDocumentPreviewStore()
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
  const referenceInfo = useMemoObservable(
    (): Observable<ParentReferenceInfo> => {
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
          )
          .pipe(
            // this debounce time is needed to prevent flashing banners due to
            // the router state updating faster than the content-lake state. we
            // debounce to wait for more emissions because the value pulled
            // initially could be stale.
            debounceTime(750),
            map(
              ({draft, published}): ParentReferenceInfo => ({
                loading: false,
                result: {
                  availability: {
                    draft: draft.availability,
                    published: published.availability,
                  },
                  refValue: pathGet<Reference>(draft.snapshot || published.snapshot, parentRefPath)
                    ?._ref,
                },
              }),
            ),
          ),
      )
    },
    [documentPreviewStore, parentId, parentRefPath],
    {loading: true},
  )

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
    <Root shadow={1} tone="caution" data-testid="reference-changed-banner">
      <Container paddingX={4} paddingY={2} sizing="border" width={1}>
        <Flex align="center">
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>

          {referenceInfo.result?.refValue ? (
            <>
              <Box flex={1} marginLeft={3}>
                <TextOneLine
                  title={t('banners.reference-changed-banner.reason-changed.text')}
                  size={1}
                >
                  {t('banners.reference-changed-banner.reason-changed.text')}
                </TextOneLine>
              </Box>
              <Box marginLeft={3}>
                <Button
                  onClick={handleReloadReference}
                  icon={SyncIcon}
                  mode="ghost"
                  text={t('banners.reference-changed-banner.reason-changed.reload-button.text')}
                />
              </Box>
            </>
          ) : (
            <>
              <Box flex={1} marginLeft={3}>
                <TextOneLine
                  title={t('banners.reference-changed-banner.reason-removed.text')}
                  size={1}
                >
                  {t('banners.reference-changed-banner.reason-removed.text')}
                </TextOneLine>
              </Box>
              <Box marginLeft={3}>
                <Button
                  as={BackLink}
                  icon={CloseIcon}
                  mode="ghost"
                  text={t('banners.reference-changed-banner.reason-removed.close-button.text')}
                />
              </Box>
            </>
          )}
        </Flex>
      </Container>
    </Root>
  )
})

ReferenceChangedBanner.displayName = 'ReferenceChangedBanner'
