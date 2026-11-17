import {type ReleaseDocument} from '@sanity/client'
import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {Card, useMediaIndex} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'
import {Box, Container, Flex} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {CalendarFilter} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import useDialogTimeZone from '../../../hooks/useDialogTimeZone'
import {useTimeZone} from '../../../hooks/useTimeZone'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {useScheduledDraftsEnabled} from '../../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {useWorkspace} from '../../../studio/workspace'
import {isCardinalityOneRelease, isPausedCardinalityOneRelease} from '../../../util/releaseUtils'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {CreateReleaseDialog} from '../../components/dialog/CreateReleaseDialog'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {useCreateReleaseAvailability} from '../../hooks/useCreateReleaseAvailability'
import {releasesLocaleNamespace} from '../../i18n'
import {countSharedGroups, useSharedReleaseGroups} from '../../model/releaseMemberGroups'
import {isReleaseDocument} from '../../store/types'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {type ReleasesMetadata, useReleasesMetadata} from '../../store/useReleasesMetadata'
import {getReleaseAttention} from '../../util/getReleaseAttention'
import {getReleaseTone} from '../../util/getReleaseTone'
import {
  isSameReleaseDateFilter,
  type ReleaseDateFilter,
  releaseMatchesDateFilter,
  resolveReleaseDateFilter,
} from '../../util/releaseDateFilter'
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
import {NeedsDecisionFilter} from './NeedsDecisionFilter'
import {
  buildReleasesSearchParams,
  type CardinalityView,
  getInitialCardinalityView,
  getInitialDateFilter,
  getInitialReleaseGroupMode,
  getInitialReleaseNotFound,
  type Mode,
} from './queryParamUtils'
import {ReleaseBulkActions} from './ReleaseBulkActions'
import {DateFilterButton, RELEASE_CALENDAR_FILTER_DAY} from './ReleaseCalendarFilter'
import {ReleaseMenuButtonWrapper} from './ReleaseMenuButtonWrapper'
import {ReleaseNotFoundBanner} from './ReleaseNotFoundBanner'
import {ReleasesEmptyState} from './ReleasesEmptyState'
import {releasesOverviewColumnDefs} from './ReleasesOverviewColumnDefs'
import {ReleaseTimeline} from './ReleaseTimeline'
import {ScheduledDraftMenuButtonWrapper} from './ScheduledDraftMenuButtonWrapper'
import {ScheduledDraftsEmptyState} from './ScheduledDraftsEmptyState'
import {SchedulesUpsell} from './SchedulesUpsell'
import {SegmentedControl} from './SegmentedControl'
import {useReleaseLabelMode} from './useReleaseLabelMode'

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
  /** How many of the release's documents are also in another active release. */
  sharedDocumentCount?: number
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
  const {document, releases: releasesConfig, beta} = useWorkspace()
  const isReleasesEnabled = Boolean(releasesConfig?.enabled)
  const isDraftModelEnabled = document?.drafts?.enabled
  const variantsEnabled = Boolean(beta?.variants?.enabled)
  const labelMode = useReleaseLabelMode()
  const {byId: variantsById, loading: variantsLoading} = useAllVariants()

  const router = useRouter()
  const navigateRef = useRef(router.navigate)
  const [releaseGroupMode, setReleaseGroupMode] = useState<Mode>(getInitialReleaseGroupMode(router))

  const cardinalityView = useMemo(
    () => getInitialCardinalityView({router, isScheduledDraftsEnabled, isReleasesEnabled})(),
    [router, isScheduledDraftsEnabled, isReleasesEnabled],
  )

  // One date filter for the overview: a day from the calendar, a week or month from a timeline
  // column heading, or Unscheduled from the timeline chip. Picking any one replaces the others.
  const [releaseDateFilter, setReleaseDateFilter] = useState<ReleaseDateFilter | undefined>(
    getInitialDateFilter(router),
  )
  const [showReleaseNotFound, setShowReleaseNotFound] = useState<boolean>(() =>
    getInitialReleaseNotFound(router),
  )
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)
  // "N releases need a decision" filter. Off on load; it and the date filter exclude each other.
  const [needsDecisionOnly, setNeedsDecisionOnly] = useState(false)
  // Captured once per mount, like the timeline axis, so the count does not shift on re-render.
  const [now] = useState(() => new Date())

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
  // Across every active release, both views: a scheduled draft can share a document with a release.
  const {sharedGroups} = useSharedReleaseGroups()
  const {data: releasesMetadata, loading: loadingReleasesMetadata} = useReleasesMetadata(releaseIds)
  const loading = loadingReleases || (loadingReleasesMetadata && !releasesMetadata)
  const loadingTableData = loading || (!releasesMetadata && Boolean(releaseIds.length))
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const timeZoneScope = CONTENT_RELEASES_TIME_ZONE_SCOPE
  const {timeZone, utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone(timeZoneScope)
  const {selectedPerspective} = usePerspective()
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone(timeZoneScope)

  const createReleaseAvailability = useCreateReleaseAvailability()

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
      sharedDocumentCount: countSharedGroups(sharedGroups, release._id),
    }))
  }, [hasReleases, releasesMetadata, releases, sharedGroups])

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

  const handleCardinalityViewChange = useCallback(
    (view: CardinalityView) => () => {
      router.navigate({
        _searchParams: buildReleasesSearchParams(releaseDateFilter, releaseGroupMode, view),
      })
    },
    [router, releaseDateFilter, releaseGroupMode],
  )

  const handleSelectFilterDate = useCallback(
    (date?: Date) => {
      setNeedsDecisionOnly(false)
      setReleaseDateFilter((prevFilter) => {
        if (!date) return undefined
        const next: ReleaseDateFilter = {
          kind: 'range',
          unit: 'day',
          start: toLocalDateComponents(date, utcToCurrentZoneDate),
        }
        return isSameReleaseDateFilter(prevFilter, next) ? undefined : next
      })
    },
    [utcToCurrentZoneDate],
  )

  // From the timeline: a column heading (week/month) or the Unscheduled chip. Pressing the active
  // one again clears it. A date filter and the needs-decision filter replace each other.
  const handleSelectTimelineFilter = useCallback((next: ReleaseDateFilter) => {
    setNeedsDecisionOnly(false)
    setReleaseDateFilter((prevFilter) =>
      isSameReleaseDateFilter(prevFilter, next) ? undefined : next,
    )
  }, [])

  const handleToggleNeedsDecision = useCallback(() => {
    if (!needsDecisionOnly) {
      // Only open releases can need a decision, and the date filter would hide some of them.
      setReleaseDateFilter(undefined)
      setReleaseGroupMode('active')
    }
    setNeedsDecisionOnly(!needsDecisionOnly)
  }, [needsDecisionOnly])

  const clearFilterDate = useCallback(() => {
    // Date filter and lifecycle are independent now — clearing the date leaves the current
    // lifecycle view (Active/Paused/Archived) untouched.
    setReleaseDateFilter(undefined)
  }, [])

  const handleNavigateToPaused = useCallback(() => {
    setReleaseDateFilter(undefined)
    setReleaseGroupMode('paused')
  }, [])

  useEffect(() => {
    navigateRef.current = router.navigate
  })

  // replace avoids a duplicate history entry alongside the user's navigation, which would swallow back clicks.
  useEffect(() => {
    navigateRef.current(
      {
        _searchParams: buildReleasesSearchParams(
          releaseDateFilter,
          releaseGroupMode,
          isScheduledDraftsEnabled ? cardinalityView : 'releases',
        ),
      },
      {replace: true},
    )
  }, [releaseDateFilter, releaseGroupMode, cardinalityView, isScheduledDraftsEnabled])

  const currentArchivedPicker = useMemo(() => {
    // Lifecycle is a "pick one of N" filter → the shared SegmentedControl (same widget as the
    // cardinality picker and the timeline zoom). Paused only appears in the drafts view; a mode
    // with nothing in it is disabled, with a tooltip explaining why. No lifecycle colour — these
    // are neutral filter tabs (green stays reserved for the readiness "good to go").
    const items = [
      {value: 'active' as Mode, label: t('action.open'), testId: 'group-mode-active'},
      ...(cardinalityView === 'drafts'
        ? [
            {
              value: 'paused' as Mode,
              label: t('action.paused'),
              disabled: !pausedReleases.length,
              tooltip: pausedReleases.length ? undefined : t('no-paused-release'),
              testId: 'group-mode-paused',
            },
          ]
        : []),
      {
        value: 'archived' as Mode,
        label: t('action.archived'),
        disabled: !archivedReleases.length,
        tooltip: archivedReleases.length ? undefined : t('no-archived-release'),
        testId: 'group-mode-archived',
      },
    ]
    return (
      <SegmentedControl
        value={releaseGroupMode}
        onChange={setReleaseGroupMode}
        disabled={loading || !hasReleases}
        items={items}
      />
    )
  }, [
    loading,
    hasReleases,
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
        disabled={createReleaseAvailability.disabled || isCreateReleaseDialogOpen}
        onClick={handleOnClickCreateRelease}
        text={tCore('release.action.create-new')}
        tooltipProps={{
          disabled: createReleaseAvailability.tooltip === undefined,
          content: createReleaseAvailability.tooltip,
        }}
      />
    )
  }, [
    cardinalityView,
    createReleaseAvailability.disabled,
    createReleaseAvailability.tooltip,
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

      // Route by the ROW's cardinality, not the current view: a single-document
      // release always gets the scheduled-draft menu (Publish now / Edit schedule /
      // Delete schedule), a bundle always gets the release menu (Run release /
      // Schedule / Unschedule / …) — consistent across All / Releases / Scheduled drafts.
      if (isCardinalityOneRelease(release)) {
        return <ScheduledDraftMenuButtonWrapper release={release} />
      }

      const documentsCount =
        (releaseGroupMode === 'active'
          ? release.documentsMetadata?.documentCount
          : release.finalDocumentStates?.length) ?? 0

      return <ReleaseMenuButtonWrapper release={release} documentsCount={documentsCount} />
    },
    [releaseGroupMode],
  )

  // Open releases in this view that need a decision. Counted without the date filter, so the
  // button shows the same number whatever day is picked.
  const needsDecisionIds = useMemo(() => {
    const openInView = filterReleasesForOverview({
      releases: tableReleases,
      archivedReleases,
      cardinalityView,
      releaseGroupMode: 'active',
    })
    return new Set(
      openInView
        .filter((release) => getReleaseAttention(release, now) !== null)
        .map((release) => release._id),
    )
  }, [tableReleases, archivedReleases, cardinalityView, now])

  const filteredReleases = useMemo(() => {
    // The date filter is managed from the timeline (a non-archived surface), so it only applies
    // outside Archived — no invisible filtering of the archived list, which has no calendar control.
    const resolvedDateFilter =
      releaseDateFilter && releaseGroupMode !== 'archived'
        ? resolveReleaseDateFilter(releaseDateFilter, zoneDateToUtc)
        : undefined
    const dateFilter = resolvedDateFilter
      ? (release: TableRelease) => releaseMatchesDateFilter(release, resolvedDateFilter)
      : undefined

    const result = filterReleasesForOverview({
      releases: tableReleases,
      archivedReleases,
      cardinalityView,
      releaseGroupMode,
      dateFilter,
    })

    return needsDecisionOnly && releaseGroupMode !== 'archived'
      ? result.filter((release) => needsDecisionIds.has(release._id))
      : result
  }, [
    tableReleases,
    archivedReleases,
    cardinalityView,
    releaseGroupMode,
    releaseDateFilter,
    zoneDateToUtc,
    needsDecisionOnly,
    needsDecisionIds,
  ])

  // The timeline is the navigator for the date filter, so it keeps showing every release the
  // lifecycle and view allow: filtering to a week must not collapse the axis to that week.
  const timelineReleases = useMemo(
    () =>
      filterReleasesForOverview({
        releases: tableReleases,
        archivedReleases,
        cardinalityView,
        releaseGroupMode,
      }),
    [tableReleases, archivedReleases, cardinalityView, releaseGroupMode],
  )

  const showConfirmActiveScheduledDraftsBanner =
    cardinalityView === 'drafts' &&
    releases.some((release) => release.state === 'active' && isCardinalityOneRelease(release))

  const calendarFilterContent = useMemo(
    () => (
      <CalendarFilter
        disabled={loading || releases.length === 0}
        renderCalendarDay={RELEASE_CALENDAR_FILTER_DAY[cardinalityView]}
        selectedDate={
          releaseDateFilter?.kind === 'range' && releaseDateFilter.unit === 'day'
            ? releaseDateFilter.start
            : undefined
        }
        onSelect={handleSelectFilterDate}
        timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
      />
    ),
    [loading, releases, releaseDateFilter, handleSelectFilterDate, cardinalityView],
  )

  const tableColumns = useMemo(
    () =>
      releasesOverviewColumnDefs(t, releaseGroupMode, cardinalityView, {
        variantsById: variantsEnabled ? variantsById : undefined,
        variantsLoading: variantsEnabled && variantsLoading,
        labelMode,
      }),
    [
      cardinalityView,
      releaseGroupMode,
      t,
      variantsEnabled,
      variantsById,
      variantsLoading,
      labelMode,
    ],
  )

  const getReleaseKey = useCallback((release: TableRelease) => release._id, [])
  const searchReleasePredicate = useCallback(
    (release: TableRelease, term: string) =>
      (release.metadata?.title || '').toLowerCase().includes(term.toLowerCase()),
    [],
  )

  // Command-lane filter slot: the lifecycle tabs, ALWAYS. Date filtering is now independent — its
  // trigger + active chip live together in the timeline header (see `dateControl`), so the tabs no
  // longer get swapped out. Both filters apply together.
  const filterTabsNode = useMemo(() => {
    if (!loadingOrHasReleases) return undefined
    return currentArchivedPicker
  }, [loadingOrHasReleases, currentArchivedPicker])

  // Multi-select is available for All, Releases, and Scheduled drafts views, in Active/Paused/
  // Archived modes — each view+mode combination gets its own action set from ReleaseBulkActions
  // (All/Releases active: archive/archive-and-delete; All/Releases archived: unarchive/delete;
  // Scheduled drafts active/paused: delete schedule; Scheduled drafts archived: unarchive/delete).
  //
  // filteredReleases is exactly what's rendered in the table for the current view/mode (it's
  // already scoped by filterReleasesForOverview to the active-vs-archived source array and any
  // date filter), so it's the correct array to resolve selectedKeys -> release objects from —
  // no need to branch between tableReleases/archivedReleases ourselves.
  const bulkSelection = useMemo<DocumentTableSelection | undefined>(() => {
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
        const selectedReleases = filteredReleases.filter((release) =>
          selectedKeySet.has(release._id),
        )
        return (
          <ReleaseBulkActions
            selectedReleases={selectedReleases}
            mode={releaseGroupMode}
            cardinalityView={cardinalityView}
            compact={compact}
            onClear={clear}
          />
        )
      },
    }
  }, [cardinalityView, releaseGroupMode, t, filteredReleases])

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
    <Flex flexDirection="column" flexBasis="0%" flexGrow={1} style={{height: '100%'}}>
      {/* Page toolbar (zone 0): reads left→right as SETTING · SCOPE · ACTION. The timezone is a
          global time lens (re-clocks every date on the page), so it sits on the LEFT as a setting,
          grouped with the date-related controls; the cardinality picker is the horizontally-centered
          primary navigation; New release — the actual action — sits alone on the right. Time-scoped
          FILTERS (calendar date, lifecycle tabs, search) live below in the timeline zone / command
          lane. */}
      <Card flex="none" padding={3}>
        {/* Toolbar, timeline and table share the table's 1280px column, so on wide screens they
            read as one page rather than spreading to the edges. */}
        <Container size={3}>
          <Flex alignItems="center" gap={3} flexWrap="wrap">
            <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2}>
              <Button
                icon={EarthGlobeIcon}
                mode="bleed"
                onClick={dialogTimeZoneShow}
                {...timeZoneButtonProps}
              />
              {DialogTimeZone && <DialogTimeZone {...dialogProps} />}
            </Flex>
            <CardinalityViewPicker
              cardinalityView={cardinalityView}
              loading={loading}
              onCardinalityViewChange={handleCardinalityViewChange}
              isScheduledDraftsEnabled={isScheduledDraftsEnabled}
              allReleases={allReleases}
              isReleasesEnabled={isReleasesEnabled}
              isDraftModelEnabled={isDraftModelEnabled}
            />
            <Flex alignItems="center" flexBasis="0%" flexGrow={1} justifyContent="flex-end" gap={2}>
              {loadingOrHasReleases && createReleaseButton}
            </Flex>
          </Flex>
        </Container>
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
          hasDateFilter={Boolean(releaseDateFilter)}
          onNavigateToPaused={handleNavigateToPaused}
        />
      )}

      {!hasNoReleases && releaseGroupMode !== 'archived' && (
        <ReleaseTimeline
          releases={timelineReleases}
          dateFilter={releaseDateFilter}
          onSelectDateFilter={handleSelectTimelineFilter}
          dateControl={
            <Flex alignItems="center" gap={1}>
              <CalendarPopover content={calendarFilterContent} asDialog={isNarrowViewport} />
              {releaseDateFilter && (
                <DateFilterButton filter={releaseDateFilter} onClear={clearFilterDate} />
              )}
              <NeedsDecisionFilter
                count={needsDecisionIds.size}
                active={needsDecisionOnly}
                onToggle={handleToggleNeedsDecision}
              />
            </Flex>
          }
        />
      )}

      {hasNoReleases ? (
        renderNoReleasesEmptyState()
      ) : (
        <DocumentTable<TableRelease>
          // reset search/selection/sort when the filter axis changes
          key={
            releaseDateFilter ? 'by_date' : needsDecisionOnly ? 'needs_decision' : releaseGroupMode
          }
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
