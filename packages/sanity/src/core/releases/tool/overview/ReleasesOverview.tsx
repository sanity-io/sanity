/* eslint-disable max-statements */
import {type ReleaseDocument} from '@sanity/client'
import {AddIcon, ChevronDownIcon, EarthGlobeIcon} from '@sanity/icons'
import {Box, type ButtonMode, Card, Flex, Inline, useMediaIndex} from '@sanity/ui'
import {isSameDay} from 'date-fns/isSameDay'
import {AnimatePresence, motion} from 'motion/react'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Tooltip} from '../../../../ui-components'
import {Button} from '../../../../ui-components/button/Button'
import {CalendarFilter} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import useDialogTimeZone from '../../../hooks/useDialogTimeZone'
import {useTimeZone} from '../../../hooks/useTimeZone'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {useScheduledDraftsEnabled} from '../../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {useWorkspace} from '../../../studio/workspace'
import {isCardinalityOneRelease, isPausedCardinalityOneRelease} from '../../../util/releaseUtils'
import {CreateReleaseDialog} from '../../components/dialog/CreateReleaseDialog'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../i18n'
import {isReleaseDocument} from '../../store/types'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {type ReleasesMetadata, useReleasesMetadata} from '../../store/useReleasesMetadata'
import {getIsScheduledDateInPast} from '../../util/getIsScheduledDateInPast'
import {getReleaseTone} from '../../util/getReleaseTone'
import {
  filterReleasesForOverview,
  getReleaseDefaults,
  shouldShowReleaseInView,
} from '../../util/util'
import {Table, type TableRowProps} from '../components/Table/Table'
import {type TableSort} from '../components/Table/TableProvider'
import {CalendarPopover} from './CalendarPopover'
import {CardinalityViewPicker} from './CardinalityViewPicker'
import {ConfirmActiveScheduledDraftsBanner} from './ConfirmActiveScheduledDraftsBanner'
import {DraftsDisabledBanner} from './DraftsDisabledBanner'
import {
  buildReleasesSearchParams,
  type CardinalityView,
  getInitialCardinalityView,
  getInitialFilterDate,
  getInitialReleaseGroupMode,
  getInitialReleaseNotFound,
  type Mode,
} from './queryParamUtils'
import {createReleaseCalendarFilterDay, DateFilterButton} from './ReleaseCalendarFilter'
import {ReleaseMenuButtonWrapper} from './ReleaseMenuButtonWrapper'
import {ReleaseNotFoundBanner} from './ReleaseNotFoundBanner'
import {ReleasesEmptyState} from './ReleasesEmptyState'
import {releasesOverviewColumnDefs} from './ReleasesOverviewColumnDefs'
import {ScheduledDraftMenuButtonWrapper} from './ScheduledDraftMenuButtonWrapper'
import {ScheduledDraftsEmptyState} from './ScheduledDraftsEmptyState'
import {scheduledDraftsOverviewColumnDefs} from './ScheduledDraftsOverviewColumnDefs'
import {SchedulesUpsell} from './SchedulesUpsell'
import {useTimezoneAdjustedDateTimeRange} from './useTimezoneAdjustedDateTimeRange'

const MotionButton = motion.create(Button)

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishAt', direction: 'asc'}
const DEFAULT_ARCHIVED_RELEASES_OVERVIEW_SORT: TableSort = {
  column: 'lastActivity',
  direction: 'desc',
}

function toLocalDateComponents(utcDate: Date, utcToZoneDate: (date: Date) => Date): Date {
  const tz = utcToZoneDate(utcDate)
  return new Date(tz.getFullYear(), tz.getMonth(), tz.getDate())
}

export function ReleasesOverview() {
  const {data: allReleases, loading: loadingReleases} = useActiveReleases()
  const {data: allArchivedReleases} = useArchivedReleases()
  const {mode: releasesUpsellMode, handleOpenDialog: handleOpenReleasesUpsellDialog} =
    useReleasesUpsell()
  const {mode: scheduledDraftsMode} = useSingleDocReleaseEnabled()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {document, releases: releasesConfig} = useWorkspace()
  const isReleasesEnabled = Boolean(releasesConfig?.enabled)
  const isDraftModelEnabled = document?.drafts?.enabled

  const router = useRouter()
  const [releaseGroupMode, setReleaseGroupMode] = useState<Mode>(getInitialReleaseGroupMode(router))

  const [cardinalityView, setCardinalityView] = useState<CardinalityView>(
    getInitialCardinalityView({router, isScheduledDraftsEnabled, isReleasesEnabled}),
  )

  const [releaseFilterDate, setReleaseFilterDate] = useState<Date | undefined>(
    getInitialFilterDate(router),
  )
  const [showReleaseNotFound, setShowReleaseNotFound] = useState<boolean>(() =>
    getInitialReleaseNotFound(router),
  )
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)

  // Filter releases based on cardinality view
  // 'releases' view shows releases with cardinality 'many' or undefined
  // 'drafts' view shows releases with cardinality 'one'
  const releases = useMemo(
    () => allReleases.filter(shouldShowReleaseInView(cardinalityView)),
    [allReleases, cardinalityView],
  )

  const archivedReleases = useMemo(
    () => allArchivedReleases.filter(shouldShowReleaseInView(cardinalityView)),
    [allArchivedReleases, cardinalityView],
  )

  const pausedReleases = useMemo(
    () =>
      cardinalityView === 'drafts'
        ? releases.filter((release) => isPausedCardinalityOneRelease(release))
        : [],
    [releases, cardinalityView],
  )

  const releaseIds = useMemo(() => releases.map((release) => release._id), [releases])
  const {data: releasesMetadata, loading: loadingReleasesMetadata} = useReleasesMetadata(releaseIds)
  const loading = loadingReleases || (loadingReleasesMetadata && !releasesMetadata)
  const loadingTableData = loading || (!releasesMetadata && Boolean(releaseIds.length))
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const timeZoneScope = CONTENT_RELEASES_TIME_ZONE_SCOPE
  const {timeZone, utcToCurrentZoneDate} = useTimeZone(timeZoneScope)
  const {selectedPerspective} = usePerspective()
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone(timeZoneScope)
  const getTimezoneAdjustedDateTimeRange = useTimezoneAdjustedDateTimeRange()

  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)

  const mediaIndex = useMediaIndex()

  const getRowProps = useCallback(
    (datum: TableRelease): Partial<TableRowProps> => {
      if (datum.isDeleted) {
        return {tone: 'transparent'}
      }

      if (isReleaseDocument(selectedPerspective) && selectedPerspective._id === datum._id) {
        return {tone: getReleaseTone(datum)}
      }

      if (datum.state === 'active' && getIsScheduledDateInPast(datum)) {
        return {tone: 'caution'}
      }

      return {tone: 'default'}
    },
    [selectedPerspective],
  )

  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)

  const hasReleases = releases.length > 0 || archivedReleases.length > 0
  // banner that shows when drafts mode is disabled, or scheduled drafts are disabled
  // but there are still scheduled drafts
  const showDraftsDisabledBanner =
    cardinalityView === 'drafts' && (!isDraftModelEnabled || !isScheduledDraftsEnabled)
  const loadingOrHasReleases = loading || hasReleases
  const hasNoReleases = !loading && !hasReleases

  const tableReleases = useMemo<TableRelease[]>(() => {
    if (!hasReleases || !releasesMetadata) return []
    return releases.map((release) => ({
      ...release,
      publishAt: release.publishAt || release.metadata.intendedPublishAt,
      documentsMetadata: releasesMetadata[release._id] || {},
    }))
  }, [hasReleases, releasesMetadata, releases])

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    void checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((hasPermissions) => {
      if (isMounted.current) setHasCreatePermission(hasPermissions)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  // switch to open mode if on archived mode and there are no archived releases
  if (releaseGroupMode === 'archived' && !loadingReleases && !archivedReleases.length) {
    setReleaseGroupMode('active')
  }

  // switch to open mode if on paused mode and there are no paused releases
  if (releaseGroupMode === 'paused' && !loadingReleases && !pausedReleases.length) {
    setReleaseGroupMode('active')
  }

  const handleDismissReleaseNotFound = useCallback(() => {
    setShowReleaseNotFound(false)
  }, [])

  const handleReleaseGroupModeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    ({currentTarget: {value: groupMode}}) => {
      setReleaseGroupMode(groupMode as Mode)
    },
    [],
  )

  const handleCardinalityViewChange = useCallback(
    (view: CardinalityView) => () => setCardinalityView(view),
    [],
  )

  const handleSelectFilterDate = useCallback(
    (date?: Date) =>
      setReleaseFilterDate((prevFilterDate) => {
        if (!date) return undefined
        const normalized = toLocalDateComponents(date, utcToCurrentZoneDate)
        return prevFilterDate && isSameDay(prevFilterDate, normalized) ? undefined : normalized
      }),
    [utcToCurrentZoneDate],
  )

  const clearFilterDate = useCallback(() => {
    setReleaseFilterDate(undefined)
    setReleaseGroupMode('active')
  }, [])

  const handleNavigateToPaused = useCallback(() => {
    setReleaseFilterDate(undefined)
    setReleaseGroupMode('paused')
  }, [])

  useEffect(() => {
    router.navigate({
      _searchParams: buildReleasesSearchParams(
        releaseFilterDate,
        releaseGroupMode,
        isScheduledDraftsEnabled ? cardinalityView : 'releases',
      ),
    })
  }, [releaseFilterDate, releaseGroupMode, cardinalityView, router, isScheduledDraftsEnabled])

  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const showCalendar = mediaIndex > 2

  const currentArchivedPicker = useMemo(() => {
    const groupModeButtonBaseProps = {
      disabled: loading || !hasReleases,
      mode: 'bleed' as ButtonMode,
      padding: 2,
      ...(hasMounted
        ? {
            initial: {opacity: 0},
            animate: {opacity: 1},
            transition: {duration: 0.4, ease: 'easeInOut' as const},
          }
        : {}),
    }
    return (
      <AnimatePresence>
        <MotionButton
          key="open-group"
          {...groupModeButtonBaseProps}
          onClick={handleReleaseGroupModeChange}
          selected={releaseGroupMode === 'active'}
          text={t('action.open')}
          value="active"
        />
        {cardinalityView === 'drafts' && (
          <Tooltip
            disabled={pausedReleases.length !== 0}
            content={t('no-paused-release')}
            placement="bottom"
          >
            <div>
              <MotionButton
                key="paused-group"
                {...groupModeButtonBaseProps}
                disabled={groupModeButtonBaseProps.disabled || !pausedReleases.length}
                onClick={handleReleaseGroupModeChange}
                selected={releaseGroupMode === 'paused'}
                text={t('action.paused')}
                value="paused"
              />
            </div>
          </Tooltip>
        )}
        <Tooltip
          disabled={archivedReleases.length !== 0}
          content={t('no-archived-release')}
          placement="bottom"
        >
          <div>
            <MotionButton
              key="archived-group"
              {...groupModeButtonBaseProps}
              disabled={groupModeButtonBaseProps.disabled || !archivedReleases.length}
              onClick={handleReleaseGroupModeChange}
              selected={releaseGroupMode === 'archived'}
              text={t('action.archived')}
              value="archived"
            />
          </div>
        </Tooltip>
      </AnimatePresence>
    )
  }, [
    loading,
    hasReleases,
    hasMounted,
    handleReleaseGroupModeChange,
    releaseGroupMode,
    t,
    archivedReleases.length,
    pausedReleases.length,
    cardinalityView,
  ])

  const handleOnClickCreateRelease = useCallback(() => {
    if (releasesUpsellMode === 'upsell') {
      handleOpenReleasesUpsellDialog()
      return
    }
    setIsCreateReleaseDialogOpen(true)
  }, [releasesUpsellMode, handleOpenReleasesUpsellDialog])

  const createReleaseButton = useMemo(() => {
    if (isScheduledDraftsEnabled && cardinalityView === 'drafts') return null

    return (
      <Button
        icon={AddIcon}
        disabled={!hasCreatePermission || isCreateReleaseDialogOpen}
        onClick={handleOnClickCreateRelease}
        text={tCore('release.action.create-new')}
        tooltipProps={{
          disabled: hasCreatePermission === true,
          content: tCore('release.action.permission.error'),
        }}
      />
    )
  }, [
    cardinalityView,
    hasCreatePermission,
    isCreateReleaseDialogOpen,
    handleOnClickCreateRelease,
    tCore,
    isScheduledDraftsEnabled,
  ])

  const handleOnCreateRelease = useCallback(
    (createdReleaseId: string) => {
      setIsCreateReleaseDialogOpen(false)

      router.navigate(
        {releaseId: createdReleaseId},
        {
          stickyParams: {
            excludedPerspectives: null,
            perspective: createdReleaseId,
          },
        },
      )
    },
    [router],
  )

  const renderRowActions = useCallback(
    ({datum}: {datum: TableRelease | unknown}) => {
      const release = datum as TableRelease

      if (release.isDeleted || release.isLoading) return null

      if (cardinalityView === 'drafts') {
        return <ScheduledDraftMenuButtonWrapper release={release} />
      }

      const documentsCount =
        (releaseGroupMode === 'active'
          ? release.documentsMetadata?.documentCount
          : release.finalDocumentStates?.length) ?? 0

      return <ReleaseMenuButtonWrapper release={release} documentsCount={documentsCount} />
    },
    [releaseGroupMode, cardinalityView],
  )

  const filteredReleases = useMemo(() => {
    const dateFilter = releaseFilterDate
      ? {
          filterDate: releaseFilterDate,
          getTimezoneAdjustedDateTimeRange,
        }
      : undefined

    return filterReleasesForOverview({
      releases: tableReleases,
      archivedReleases,
      cardinalityView,
      releaseGroupMode,
      dateFilter,
    })
  }, [
    tableReleases,
    archivedReleases,
    cardinalityView,
    releaseGroupMode,
    releaseFilterDate,
    getTimezoneAdjustedDateTimeRange,
  ])

  const showConfirmActiveScheduledDraftsBanner =
    cardinalityView === 'drafts' &&
    releases.some((release) => release.state === 'active' && isCardinalityOneRelease(release))

  const renderCalendarFilter = useMemo(() => {
    return (
      <Flex flex="none">
        <Card borderRight flex="none" disabled>
          <CalendarFilter
            disabled={loading || releases.length === 0}
            renderCalendarDay={createReleaseCalendarFilterDay(cardinalityView)}
            selectedDate={releaseFilterDate}
            onSelect={handleSelectFilterDate}
            timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
          />
        </Card>
      </Flex>
    )
  }, [loading, releases, releaseFilterDate, handleSelectFilterDate, cardinalityView])

  const tableColumns = useMemo(() => {
    if (cardinalityView === 'drafts') {
      return scheduledDraftsOverviewColumnDefs(t, releaseGroupMode)
    }
    return releasesOverviewColumnDefs(t, releaseGroupMode)
  }, [cardinalityView, releaseGroupMode, t])

  const hasBannerAboveTable =
    showReleaseNotFound || showDraftsDisabledBanner || showConfirmActiveScheduledDraftsBanner

  const isArchivedReleasesView = releaseGroupMode === 'archived' && cardinalityView === 'releases'
  const defaultTableSort = isArchivedReleasesView
    ? DEFAULT_ARCHIVED_RELEASES_OVERVIEW_SORT
    : DEFAULT_RELEASES_OVERVIEW_SORT

  const releasesEmptyStateComponent = useCallback(
    () => <ReleasesEmptyState createReleaseButton={createReleaseButton} />,
    [createReleaseButton],
  )

  const tableEmptyState = useMemo(() => {
    if (cardinalityView === 'releases' && releaseGroupMode === 'active') {
      return releasesEmptyStateComponent
    }
    // Use specific text for drafts view
    if (cardinalityView === 'drafts') {
      return t('no-scheduled-drafts')
    }
    // Use default text empty state for other cases (archived, etc.)
    return t('no-releases')
  }, [cardinalityView, releaseGroupMode, releasesEmptyStateComponent, t])

  function renderNoReleasesEmptyState() {
    const isUpsell =
      (cardinalityView === 'releases' && releasesUpsellMode === 'upsell') ||
      (cardinalityView === 'drafts' && scheduledDraftsMode === 'upsell')

    if (isUpsell) {
      return <SchedulesUpsell cardinalityView={cardinalityView} />
    }

    if (cardinalityView === 'drafts') {
      return <ScheduledDraftsEmptyState />
    }

    return <ReleasesEmptyState createReleaseButton={createReleaseButton} />
  }

  return (
    <Flex direction="row" flex={1} style={{height: '100%'}}>
      <Flex flex={1}>
        {showCalendar && renderCalendarFilter}

        <Flex direction="column" flex={1} style={{position: 'relative'}}>
          <Card flex="none" padding={3}>
            <Flex align="center" flex={1} gap={3}>
              <Inline>
                {!showCalendar && <CalendarPopover content={renderCalendarFilter} />}
                <CardinalityViewPicker
                  cardinalityView={cardinalityView}
                  loading={loading}
                  onCardinalityViewChange={handleCardinalityViewChange}
                  isScheduledDraftsEnabled={isScheduledDraftsEnabled}
                  allReleases={allReleases}
                  isReleasesEnabled={isReleasesEnabled}
                  isDraftModelEnabled={isDraftModelEnabled}
                />
              </Inline>

              <Flex flex={1} gap={1}>
                {loadingOrHasReleases &&
                  (releaseFilterDate ? (
                    <DateFilterButton filterDate={releaseFilterDate} onClear={clearFilterDate} />
                  ) : (
                    currentArchivedPicker
                  ))}
              </Flex>
              <Flex flex="none" gap={2}>
                <Button
                  icon={EarthGlobeIcon}
                  iconRight={ChevronDownIcon}
                  mode="bleed"
                  text={`${timeZone.abbreviation} (${timeZone.namePretty})`}
                  onClick={dialogTimeZoneShow}
                />
                {DialogTimeZone && <DialogTimeZone {...dialogProps} />}
                {loadingOrHasReleases && createReleaseButton}
              </Flex>
            </Flex>
          </Card>
          {showReleaseNotFound && (
            <ReleaseNotFoundBanner onDismiss={handleDismissReleaseNotFound} />
          )}
          {showDraftsDisabledBanner && (
            <DraftsDisabledBanner
              isDraftModelEnabled={isDraftModelEnabled}
              isScheduledDraftsEnabled={isScheduledDraftsEnabled}
              allReleases={allReleases}
            />
          )}
          {showConfirmActiveScheduledDraftsBanner && (
            <ConfirmActiveScheduledDraftsBanner
              releases={releases}
              releaseGroupMode={releaseGroupMode}
              hasDateFilter={Boolean(releaseFilterDate)}
              onNavigateToPaused={handleNavigateToPaused}
            />
          )}

          {hasNoReleases ? (
            renderNoReleasesEmptyState()
          ) : (
            <Box
              ref={setScrollContainerRef}
              marginTop={hasBannerAboveTable ? 0 : 3}
              overflow="auto"
            >
              <Table<TableRelease>
                // for resetting filter and sort on table when filer changed
                key={releaseFilterDate ? 'by_date' : releaseGroupMode}
                defaultSort={defaultTableSort}
                loading={loadingTableData}
                data={filteredReleases}
                columnDefs={tableColumns}
                emptyState={tableEmptyState}
                // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
                rowId="_id"
                rowActions={renderRowActions}
                rowProps={getRowProps}
                scrollContainerRef={scrollContainerRef}
                hideTableInlinePadding
              />
            </Box>
          )}
        </Flex>
      </Flex>
      {isCreateReleaseDialogOpen && (
        <CreateReleaseDialog
          onCancel={() => setIsCreateReleaseDialogOpen(false)}
          onSubmit={handleOnCreateRelease}
          origin="release-plugin"
        />
      )}
    </Flex>
  )
}
