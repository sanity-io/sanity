import {AddIcon, ChevronDownIcon, EarthGlobeIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  type ButtonMode,
  Card,
  Container,
  Flex,
  Inline,
  Stack,
  Text,
  useMediaIndex,
} from '@sanity/ui'
import {format, isSameDay} from 'date-fns'
import {AnimatePresence, motion} from 'framer-motion'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type SearchParam, useRouter} from 'sanity/router'

import {Button as StudioButton, Tooltip} from '../../../../ui-components'
import {CalendarFilter} from '../../../components/inputs/DateFilters/calendar/CalendarFilter'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import useDialogTimeZone from '../../../scheduledPublishing/hooks/useDialogTimeZone'
import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'
import {CreateReleaseDialog} from '../../components/dialog/CreateReleaseDialog'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../i18n'
import {isReleaseDocument, type ReleaseDocument} from '../../store/types'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {type ReleasesMetadata, useReleasesMetadata} from '../../store/useReleasesMetadata'
import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {Table, type TableRowProps} from '../components/Table/Table'
import {type TableSort} from '../components/Table/TableProvider'
import {CalendarPopover} from './CalendarPopover'
import {
  DATE_SEARCH_PARAM_KEY,
  getInitialFilterDate,
  getInitialReleaseGroupMode,
  GROUP_SEARCH_PARAM_KEY,
  type Mode,
} from './queryParamUtils'
import {DateFilterButton, ReleaseCalendarFilterDay} from './ReleaseCalendarFilter'
import {releasesOverviewColumnDefs} from './ReleasesOverviewColumnDefs'
import {useTimezoneAdjustedDateTimeRange} from './useTimezoneAdjustedDateTimeRange'

const MotionStudioButton = motion.create(StudioButton)
const MotionUiButton = motion.create(Button)

const DATE_SEARCH_PARAM_VALUE_FORMAT = 'yyyy-MM-dd'

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishAt', direction: 'asc'}

export function ReleasesOverview() {
  const {data: releases, loading: loadingReleases} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()
  const {guardWithReleaseLimitUpsell, mode} = useReleasesUpsell()

  const router = useRouter()
  const [releaseGroupMode, setReleaseGroupMode] = useState<Mode>(getInitialReleaseGroupMode(router))
  const [releaseFilterDate, setReleaseFilterDate] = useState<Date | undefined>(
    getInitialFilterDate(router),
  )
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)
  const releaseIds = useMemo(() => releases.map((release) => release._id), [releases])
  const {data: releasesMetadata, loading: loadingReleasesMetadata} = useReleasesMetadata(releaseIds)
  const loading = loadingReleases || (loadingReleasesMetadata && !releasesMetadata)
  const loadingTableData = loading || (!releasesMetadata && Boolean(releaseIds.length))
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {timeZone, utcToCurrentZoneDate} = useTimeZone()
  const {selectedPerspective} = usePerspective()
  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone()
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

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const hasReleases = releases.length > 0 || archivedReleases.length > 0
  const loadingOrHasReleases = loading || hasReleases

  const tableReleases = useMemo<TableRelease[]>(() => {
    if (!hasReleases || !releasesMetadata) return []

    return [
      ...releases.map((release) => ({
        ...release,
        publishAt: release.publishAt || release.metadata.intendedPublishAt,
        documentsMetadata: releasesMetadata[release._id] || {},
      })),
    ]
  }, [hasReleases, releasesMetadata, releases])

  // switch to open mode if on archived mode and there are no archived releases
  useEffect(() => {
    if (releaseGroupMode === 'archived' && !loadingReleases && !archivedReleases.length) {
      setReleaseGroupMode('open')
    }
  }, [releaseGroupMode, archivedReleases.length, loadingReleases])

  const handleReleaseGroupModeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    ({currentTarget: {value: groupMode}}) => {
      setReleaseGroupMode(groupMode as Mode)
    },
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
    setReleaseGroupMode('open')
  }, [])

  useEffect(() => {
    const getSearchParams: () => SearchParam[] = () => {
      if (releaseFilterDate)
        return [[DATE_SEARCH_PARAM_KEY, format(releaseFilterDate, DATE_SEARCH_PARAM_VALUE_FORMAT)]]
      if (releaseGroupMode) return [[GROUP_SEARCH_PARAM_KEY, releaseGroupMode]]
      return []
    }

    router.navigate({
      _searchParams: getSearchParams(),
    })
  }, [releaseFilterDate, releaseGroupMode, router])

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
            transition: {duration: 0.4, ease: 'easeInOut'},
          }
        : {}),
    }
    return (
      <AnimatePresence>
        <MotionStudioButton
          {...groupModeButtonBaseProps}
          key="open-group"
          onClick={handleReleaseGroupModeChange}
          selected={releaseGroupMode === 'open'}
          text={t('action.open')}
          value="open"
        />
        <Tooltip
          disabled={archivedReleases.length !== 0}
          content={t('no-archived-release')}
          placement="bottom"
        >
          <div>
            <MotionUiButton
              {...groupModeButtonBaseProps}
              key="archived-group"
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

  const handleOnClickCreateRelease = useCallback(
    () => guardWithReleaseLimitUpsell(() => setIsCreateReleaseDialogOpen(true)),
    [guardWithReleaseLimitUpsell],
  )

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        disabled={isCreateReleaseDialogOpen || mode === 'disabled'}
        onClick={handleOnClickCreateRelease}
        text={tCore('release.action.create-new')}
      />
    ),
    [handleOnClickCreateRelease, isCreateReleaseDialogOpen, tCore, mode],
  )

  const handleOnCreateRelease = useCallback(
    (createdReleaseId: string) => {
      setIsCreateReleaseDialogOpen(false)
      router.navigate({releaseId: createdReleaseId})
    },
    [router],
  )

  const renderCreateReleaseDialog = () => {
    if (!isCreateReleaseDialogOpen) return null

    return (
      <CreateReleaseDialog
        onCancel={() => setIsCreateReleaseDialogOpen(false)}
        onSubmit={handleOnCreateRelease}
        origin="release-plugin"
      />
    )
  }

  const renderRowActions = useCallback(
    ({datum}: {datum: TableRelease | unknown}) => {
      const release = datum as TableRelease

      if (release.isDeleted) return null

      const documentsCount =
        (releaseGroupMode === 'open'
          ? release.documentsMetadata?.documentCount
          : release.finalDocumentStates?.length) ?? 0

      return <ReleaseMenuButton release={release} documentsCount={documentsCount} />
    },
    [releaseGroupMode],
  )

  const filteredReleases = useMemo(() => {
    if (!releaseFilterDate) return releaseGroupMode === 'open' ? tableReleases : archivedReleases

    const [startOfDayForTimeZone, endOfDayForTimeZone] =
      getTimezoneAdjustedDateTimeRange(releaseFilterDate)

    return tableReleases.filter((release) => {
      if (!release.publishAt || release.metadata.releaseType !== 'scheduled') return false

      const publishDateUTC = new Date(release.publishAt)
      return publishDateUTC >= startOfDayForTimeZone && publishDateUTC <= endOfDayForTimeZone
    })
  }, [
    releaseFilterDate,
    releaseGroupMode,
    tableReleases,
    archivedReleases,
    getTimezoneAdjustedDateTimeRange,
  ])

  const renderCalendarFilter = useMemo(() => {
    return (
      <Flex flex="none">
        <Card borderRight flex="none" disabled>
          <CalendarFilter
            disabled={loading || releases.length === 0}
            renderCalendarDay={ReleaseCalendarFilterDay}
            selectedDate={releaseFilterDate}
            onSelect={handleSelectFilterDate}
          />
        </Card>
      </Flex>
    )
  }, [loading, releases, releaseFilterDate, handleSelectFilterDate])

  return (
    <Flex direction="row" flex={1} style={{height: '100%'}}>
      <Flex flex={1}>
        {showCalendar && renderCalendarFilter}
        <Flex direction="column" flex={1} style={{position: 'relative'}}>
          <Card flex="none" padding={3}>
            <Flex align="flex-start" flex={1} gap={3}>
              <Inline>
                {!showCalendar && <CalendarPopover content={renderCalendarFilter} />}
                <Stack padding={2} space={4}>
                  <Text as="h1" size={1} weight="semibold">
                    {t('overview.title')}
                  </Text>
                </Stack>
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
                  padding={2}
                  text={`${timeZone.abbreviation} (${timeZone.namePretty})`}
                  onClick={dialogTimeZoneShow}
                />
                {DialogTimeZone && <DialogTimeZone {...dialogProps} />}
                {loadingOrHasReleases && createReleaseButton}
              </Flex>
            </Flex>
          </Card>
          <Box ref={scrollContainerRef} marginTop={3} overflow={'auto'}>
            {!loading && !hasReleases ? (
              <Container style={{margin: 0}} width={0}>
                <Stack space={5} padding={4}>
                  <Text data-testid="no-releases-info-text" muted size={2}>
                    {t('overview.description')}
                  </Text>
                  <Box>{createReleaseButton}</Box>
                </Stack>
              </Container>
            ) : (
              <Table<TableRelease>
                // for resetting filter and sort on table when filer changed
                key={releaseFilterDate ? 'by_date' : releaseGroupMode}
                defaultSort={DEFAULT_RELEASES_OVERVIEW_SORT}
                loading={loadingTableData}
                data={filteredReleases}
                columnDefs={releasesOverviewColumnDefs(t)}
                emptyState={t('no-releases')}
                // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
                rowId="_id"
                rowActions={renderRowActions}
                rowProps={getRowProps}
                scrollContainerRef={scrollContainerRef}
                hideTableInlinePadding
              />
            )}
          </Box>
          {renderCreateReleaseDialog()}
        </Flex>
      </Flex>
    </Flex>
  )
}
