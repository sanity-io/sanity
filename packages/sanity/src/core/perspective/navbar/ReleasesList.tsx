import {AddIcon} from '@sanity/icons'
import {Box, Flex, MenuDivider, Spinner} from '@sanity/ui'
import {type RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useReleasesUpsell} from '../../releases/contexts/upsell/useReleasesUpsell'
import {useCreateReleaseMetadata} from '../../releases/hooks/useCreateReleaseMetadata'
import {type ReleaseDocument, type ReleaseType} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useReleaseOperations} from '../../releases/store/useReleaseOperations'
import {useReleasePermissions} from '../../releases/store/useReleasePermissions'
import {LATEST} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getReleaseDefaults} from '../../releases/util/util'
import {usePerspective} from '../usePerspective'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {type ScrollElement} from './useScrollIndicatorVisibility'

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

const ASAP_RANGE_OFFSET = 2

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 75vh;
`

const StyledPublishedBox = styled(Box)<{$reducePadding: boolean; $removePadding?: boolean}>(({
  $reducePadding,
  $removePadding,
}) => {
  const padding = $reducePadding ? '4px' : '16px'
  return css`
    position: sticky;
    top: 0;
    background-color: var(--card-bg-color);
    z-index: 10;
    padding-bottom: ${$removePadding ? '0px' : padding};
  `
})

export function ReleasesList({
  areReleasesEnabled,
  setScrollContainer,
  onScroll,
  isRangeVisible,
  selectedReleaseId,
  setCreateBundleDialogOpen,
  scrollElementRef,
}: {
  areReleasesEnabled: boolean
  setScrollContainer: (el: HTMLDivElement) => void
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void
  isRangeVisible: boolean
  selectedReleaseId: string | undefined
  setCreateBundleDialogOpen: (open: boolean) => void
  scrollElementRef: RefObject<ScrollElement>
}): React.JSX.Element {
  const {guardWithReleaseLimitUpsell, mode} = useReleasesUpsell()
  const {loading, data: releases} = useActiveReleases()
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)
  const createReleaseMetadata = useCreateReleaseMetadata()
  const {selectedPerspectiveName} = usePerspective()

  const {t} = useTranslation()

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    checkWithPermissionGuard(createRelease, createReleaseMetadata(getReleaseDefaults())).then(
      (hasPermission) => {
        if (isMounted.current) setHasCreatePermission(hasPermission)
      },
    )

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease, createReleaseMetadata])

  const handleCreateBundleClick = useCallback(
    () => guardWithReleaseLimitUpsell(() => setCreateBundleDialogOpen(true)),
    [guardWithReleaseLimitUpsell, setCreateBundleDialogOpen],
  )

  const sortedReleaseTypeReleases = useMemo(
    () =>
      orderedReleaseTypes.reduce<Record<ReleaseType, ReleaseDocument[]>>(
        (ReleaseTypeReleases, releaseType) => ({
          ...ReleaseTypeReleases,
          [releaseType]: releases.filter(({metadata}) => metadata.releaseType === releaseType),
        }),
        {} as Record<ReleaseType, ReleaseDocument[]>,
      ),
    [releases],
  )

  const range: LayerRange = useMemo(() => {
    const isDraftsPerspective = typeof selectedPerspectiveName === 'undefined'
    let lastIndex = isDraftsPerspective ? 1 : 0

    const {asap, scheduled} = sortedReleaseTypeReleases
    const countAsapReleases = asap.length
    const countScheduledReleases = scheduled.length

    const offsets = {
      asap: ASAP_RANGE_OFFSET,
      scheduled: ASAP_RANGE_OFFSET + countAsapReleases,
      undecided: ASAP_RANGE_OFFSET + countAsapReleases + countScheduledReleases,
    }

    const adjustIndexForReleaseType = (type: ReleaseType) => {
      const groupSubsetReleases = sortedReleaseTypeReleases[type]
      const offset = offsets[type]

      groupSubsetReleases.forEach((release, groupReleaseIndex) => {
        const index = offset + groupReleaseIndex

        if (selectedReleaseId === getReleaseIdFromReleaseDocumentId(release._id)) {
          lastIndex = index
        }
      })
    }

    orderedReleaseTypes.forEach(adjustIndexForReleaseType)

    return {
      lastIndex,
      offsets,
    }
  }, [selectedPerspectiveName, selectedReleaseId, sortedReleaseTypeReleases])

  if (loading) {
    return (
      <Flex padding={4} justify="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <>
      <StyledBox ref={setScrollContainer} onScroll={onScroll}>
        <StyledPublishedBox
          $reducePadding={!releases.length || !areReleasesEnabled}
          $removePadding={!areReleasesEnabled}
        >
          <GlobalPerspectiveMenuItem
            rangePosition={isRangeVisible ? getRangePosition(range, 0) : undefined}
            release={'published'}
          />
          <GlobalPerspectiveMenuItem
            rangePosition={isRangeVisible ? getRangePosition(range, 1) : undefined}
            release={LATEST}
          />
        </StyledPublishedBox>
        {areReleasesEnabled && (
          <>
            {orderedReleaseTypes.map((releaseType) => (
              <ReleaseTypeMenuSection
                key={releaseType}
                releaseType={releaseType}
                releases={sortedReleaseTypeReleases[releaseType]}
                range={range}
                currentGlobalBundleMenuItemRef={scrollElementRef}
              />
            ))}
          </>
        )}
      </StyledBox>
      {areReleasesEnabled && (
        <>
          <MenuDivider />
          <MenuItem
            icon={AddIcon}
            disabled={!hasCreatePermission || mode === 'disabled'}
            onClick={handleCreateBundleClick}
            text={t('release.action.create-new')}
            data-testid="create-new-release-button"
            tooltipProps={{
              disabled: hasCreatePermission === true,
              content: t('release.action.permission.error'),
            }}
          />
        </>
      )}
    </>
  )
}
