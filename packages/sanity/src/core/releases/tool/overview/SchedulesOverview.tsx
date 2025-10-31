import {AddIcon, ChevronDownIcon, EarthGlobeIcon} from '@sanity/icons'
import {type ButtonMode, Card, Flex, Inline, useMediaIndex} from '@sanity/ui'
import {isSameDay} from 'date-fns'
import {AnimatePresence, motion} from 'framer-motion'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Tooltip} from '../../../../ui-components'
import {Button} from '../../../../ui-components/button/Button'
import {CalendarFilter} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import useDialogTimeZone from '../../../hooks/useDialogTimeZone'
import {useTimeZone} from '../../../hooks/useTimeZone'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useScheduledDraftsEnabled} from '../../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {useWorkspace} from '../../../studio/workspace'
import {CreateReleaseDialog} from '../../components/dialog/CreateReleaseDialog'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../i18n'
import {isReleaseDocument} from '../../store/types'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {useReleasesMetadata} from '../../store/useReleasesMetadata'
import {getReleaseTone} from '../../util/getReleaseTone'
import {getReleaseDefaults, shouldShowReleaseInView} from '../../util/util'
import {type TableRowProps} from '../components/Table/Table'
import {CalendarPopover} from './CalendarPopover'
import {CardinalityViewPicker} from './CardinalityViewPicker'
import {ContentReleasesOverview, type TableRelease} from './ContentReleasesOverview'
import {
  buildReleasesSearchParams,
  type CardinalityView,
  getInitialCardinalityView,
  getInitialFilterDate,
  getInitialReleaseGroupMode,
  type Mode,
} from './queryParamUtils'
import {createReleaseCalendarFilterDay, DateFilterButton} from './ReleaseCalendarFilter'
import {ScheduledDraftsOverview} from './ScheduledDraftsOverview'
import {useTimezoneAdjustedDateTimeRange} from './useTimezoneAdjustedDateTimeRange'

const MotionButton = motion.create(Button)

export function SchedulesOverview() {
  const {data: allReleases, loading: loadingReleases} = useActiveReleases()
  const {data: allArchivedReleases} = useArchivedReleases()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {document, releases: releasesConfig} = useWorkspace()
  const isReleasesEnabled = Boolean(releasesConfig?.enabled)
  const isDraftModelEnabled = Boolean(document?.drafts?.enabled)
  const {mode: releasesUpsellMode, handleOpenDialog: handleOpenReleasesUpsellDialog} =
    useReleasesUpsell()
  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()

  const router = useRouter()
  const [releaseGroupMode, setReleaseGroupMode] = useState<Mode>(getInitialReleaseGroupMode(router))

  const [cardinalityView, setCardinalityView] = useState<CardinalityView>(
    getInitialCardinalityView({router, isScheduledDraftsEnabled, isReleasesEnabled}),
  )

  const [releaseFilterDate, setReleaseFilterDate] = useState<Date | undefined>(
    getInitialFilterDate(router),
  )

  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)
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

  const mediaIndex = useMediaIndex()

  const getRowProps = useCallback(
    (datum: TableRelease): Partial<TableRowProps> =>
      datum.isDeleted
        ? {tone: 'transparent'}
        : {
            tone:
              isReleaseDocument(selectedPerspective) && selectedPerspective._id === datum._id
                ? getReleaseTone(datum)
                : 'default',
          },
    [selectedPerspective],
  )

  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)

  const hasReleases = releases.length > 0 || archivedReleases.length > 0
  const loadingOrHasReleases = loading || hasReleases

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((hasPermissions) => {
      if (isMounted.current) setHasCreatePermission(hasPermissions)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  // switch to open mode if on archived mode and there are no archived releases
  useEffect(() => {
    if (releaseGroupMode === 'archived' && !loadingReleases && !archivedReleases.length) {
      setReleaseGroupMode('active')
    }
  }, [releaseGroupMode, archivedReleases.length, loadingReleases])

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

        const timeZoneAdjustedDate = utcToCurrentZoneDate(date)

        return prevFilterDate && isSameDay(prevFilterDate, timeZoneAdjustedDate)
          ? undefined
          : timeZoneAdjustedDate
      }),
    [utcToCurrentZoneDate],
  )

  const clearFilterDate = useCallback(() => {
    setReleaseFilterDate(undefined)
    setReleaseGroupMode('active')
  }, [])

  const handleOnClickCreateRelease = useCallback(() => {
    if (releasesUpsellMode === 'upsell') {
      handleOpenReleasesUpsellDialog()
      return
    }
    setIsCreateReleaseDialogOpen(true)
  }, [releasesUpsellMode, handleOpenReleasesUpsellDialog])

  const createReleaseButton = useMemo(() => {
    if (cardinalityView === 'drafts') return null

    return (
      <Button
        icon={AddIcon}
        disabled={
          !hasCreatePermission || isCreateReleaseDialogOpen || releasesUpsellMode === 'disabled'
        }
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
    releasesUpsellMode,
    handleOnClickCreateRelease,
    tCore,
  ])

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
  ])

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

          {cardinalityView === 'drafts' ? (
            <ScheduledDraftsOverview
              releases={releases}
              archivedReleases={archivedReleases}
              releaseGroupMode={releaseGroupMode}
              loading={loading}
              loadingTableData={loadingTableData}
              releasesMetadata={releasesMetadata}
              releaseFilterDate={releaseFilterDate}
              scrollContainerRef={scrollContainerRef}
              setScrollContainerRef={setScrollContainerRef}
              getRowProps={getRowProps}
              getTimezoneAdjustedDateTimeRange={getTimezoneAdjustedDateTimeRange}
              allReleases={allReleases}
            />
          ) : (
            <ContentReleasesOverview
              releases={releases}
              archivedReleases={archivedReleases}
              releaseGroupMode={releaseGroupMode}
              loading={loading}
              loadingTableData={loadingTableData}
              releasesMetadata={releasesMetadata}
              releaseFilterDate={releaseFilterDate}
              scrollContainerRef={scrollContainerRef}
              setScrollContainerRef={setScrollContainerRef}
              getRowProps={getRowProps}
              getTimezoneAdjustedDateTimeRange={getTimezoneAdjustedDateTimeRange}
              createReleaseButton={createReleaseButton}
            />
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
