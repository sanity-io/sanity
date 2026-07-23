import {type ReleaseDocument} from '@sanity/client'
import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Box, type ButtonMode, Card, Flex, useMediaIndex} from '@sanity/ui'
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
import {getReleaseTone} from '../../util/getReleaseTone'
import {
  filterReleasesForOverview,
  getReleaseDefaults,
  shouldShowReleaseInView,
} from '../../util/util'
import {DocumentTable, type DocumentTableSelection} from '../components/Table/DocumentTable'
import {type TableRowProps} from '../components/Table/Table'
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
import {ReleaseBulkActions} from './ReleaseBulkActions'
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
  const navigateRef = useRef(router.navigate)
  const [releaseGroupMode, setReleaseGroupMode] = useState<Mode>(getInitialReleaseGroupMode(router))

  const cardinalityView = useMemo(
    () => getInitialCardinalityView({router, isScheduledDraftsEnabled, isReleasesEnabled})(),
    [router, isScheduledDraftsEnabled, isReleasesEnabled],
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
  const isNarrowViewport = mediaIndex < 2

  const timeZoneLabel = `${timeZone.abbreviation} (${timeZone.namePretty})`
  const timeZoneButtonProps = isNarrowViewport
    ? {tooltipProps: {content: timeZoneLabel}}
    : {iconRight: ChevronDownIcon, text: timeZoneLabel}

  const getRowProps = useCallback(
    (datum: TableRelease): Partial<TableRowProps> => {
      if (datum.isDeleted) {
        return {tone: 'transparent'}
      }

      if (isReleaseDocument(selectedPerspective) && selectedPerspective._id === datum._id) {
        return {tone: getReleaseTone(datum)}
      }

      return {tone: 'default'}
    },
    [selectedPerspective],
  )

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
    (view: CardinalityView) => () => {
      router.navigate({
        _searchParams: buildReleasesSearchParams(releaseFilterDate, releaseGroupMode, view),
      })
    },
    [router, releaseFilterDate, releaseGroupMode],
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
    navigateRef.current = router.navigate
  })

  // Sync filter/group state to URL, preserving the current cardinality view
  useEffect(() => {
    navigateRef.current({
      _searchParams: buildReleasesSearchParams(
        releaseFilterDate,
        releaseGroupMode,
        isScheduledDraftsEnabled ? cardinalityView : 'releases',
      ),
    })
  }, [releaseFilterDate, releaseGroupMode, cardinalityView, isScheduledDraftsEnabled])

  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler
    setHasMounted(true)
  }, [])

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
      <Flex align="center" gap={1}>
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
      </Flex>
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

  const calendarFilterContent = useMemo(
    () => (
      <CalendarFilter
        disabled={loading || releases.length === 0}
        renderCalendarDay={createReleaseCalendarFilterDay(cardinalityView)}
        selectedDate={releaseFilterDate}
        onSelect={handleSelectFilterDate}
        timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
      />
    ),
    [loading, releases, releaseFilterDate, handleSelectFilterDate, cardinalityView],
  )

  const tableColumns = useMemo(() => {
    if (cardinalityView === 'drafts') {
      return scheduledDraftsOverviewColumnDefs(t, releaseGroupMode)
    }
    return releasesOverviewColumnDefs(t, releaseGroupMode)
  }, [cardinalityView, releaseGroupMode, t])

  const getReleaseKey = useCallback((release: TableRelease) => release._id, [])
  const searchReleasePredicate = useCallback(
    (release: TableRelease, term: string) =>
      (release.metadata?.title || '').toLowerCase().includes(term.toLowerCase()),
    [],
  )

  // Command-lane filter slot: the active date-filter chip when a day is selected, otherwise the
  // Open/Paused/Archived tab strip. (Mutually exclusive, as before — but now inside the command lane
  // rather than the page toolbar, so it aligns with the columns and shares space with search.)
  const filterTabsNode = useMemo(() => {
    if (!loadingOrHasReleases) return undefined
    if (releaseFilterDate) {
      return <DateFilterButton filterDate={releaseFilterDate} onClear={clearFilterDate} />
    }
    return currentArchivedPicker
  }, [loadingOrHasReleases, releaseFilterDate, clearFilterDate, currentArchivedPicker])

  // Multi-select is only meaningful in the active releases view — the same scope where per-row
  // archive/schedule apply. Bulk Archive is wired; bulk Schedule is a disabled stub (see
  // ReleaseBulkActions). Archived and drafts views get no selection column.
  const bulkSelection = useMemo<DocumentTableSelection | undefined>(() => {
    if (cardinalityView !== 'releases' || releaseGroupMode !== 'active') return undefined
    return {
      labels: {
        selectAll: t('overview.bulk.select-all'),
        selectRow: t('overview.bulk.select-row'),
        selectedCount: (count) => t('overview.bulk.selected', {count}),
        clear: t('overview.bulk.clear'),
      },
      selectAllTestId: 'release-bulk-select-all',
      renderActions: ({selectedKeys, compact, clear}) => {
        const selectedKeySet = new Set(selectedKeys)
        const selectedReleases = tableReleases.filter((release) => selectedKeySet.has(release._id))
        return (
          <ReleaseBulkActions
            selectedReleases={selectedReleases}
            compact={compact}
            onClear={clear}
          />
        )
      },
    }
  }, [cardinalityView, releaseGroupMode, t, tableReleases])

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
    <Flex direction="column" flex={1} style={{height: '100%'}}>
      {/* Page toolbar (zone 0): cardinality view on the left; the demoted calendar filter, timezone,
          and Create on the right. The Open/Archived tabs + search now live in the DocumentTable
          command lane below, aligned with the columns. */}
      <Card flex="none" padding={3}>
        <Flex align="center" gap={3} wrap="wrap">
          <CardinalityViewPicker
            cardinalityView={cardinalityView}
            loading={loading}
            onCardinalityViewChange={handleCardinalityViewChange}
            isScheduledDraftsEnabled={isScheduledDraftsEnabled}
            allReleases={allReleases}
            isReleasesEnabled={isReleasesEnabled}
            isDraftModelEnabled={isDraftModelEnabled}
          />
          <Box flex={1} />
          <Flex align="center" flex="none" gap={2}>
            <CalendarPopover content={calendarFilterContent} asDialog={isNarrowViewport} />
            <Button
              icon={EarthGlobeIcon}
              mode="bleed"
              onClick={dialogTimeZoneShow}
              {...timeZoneButtonProps}
            />
            {DialogTimeZone && <DialogTimeZone {...dialogProps} />}
            {loadingOrHasReleases && createReleaseButton}
          </Flex>
        </Flex>
      </Card>

      {showReleaseNotFound && <ReleaseNotFoundBanner onDismiss={handleDismissReleaseNotFound} />}
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
        <DocumentTable<TableRelease>
          // reset search/selection/sort when the filter axis changes
          key={releaseFilterDate ? 'by_date' : releaseGroupMode}
          alwaysShowCommandLane
          columnDefs={tableColumns}
          defaultSort={defaultTableSort}
          emptyState={tableEmptyState}
          filterTabs={filterTabsNode}
          getRowKey={getReleaseKey}
          id="releases-overview-table"
          loading={loadingTableData}
          rows={filteredReleases}
          rowActions={renderRowActions}
          rowProps={getRowProps}
          // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
          rowId="_id"
          searchPlaceholder={t('overview.search-releases-placeholder')}
          searchPredicate={searchReleasePredicate}
          searchTestId="release-search"
          selection={bulkSelection}
        />
      )}

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
