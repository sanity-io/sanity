import {AddIcon, ChevronDownIcon, CloseIcon, EarthGlobeIcon} from '@sanity/icons'
import {Box, type ButtonMode, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {endOfDay, format, isSameDay, startOfDay} from 'date-fns'
import {zonedTimeToUtc} from 'date-fns-tz'
import {AnimatePresence, motion} from 'framer-motion'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {usePerspective} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {Button, Button as StudioButton} from '../../../../ui-components'
import {CalendarDay} from '../../../../ui-components/inputs/DateFilters/calendar/CalendarDay'
import {
  CalendarFilter,
  type CalendarProps,
} from '../../../../ui-components/inputs/DateFilters/calendar/CalendarFilter'
import {useTranslation} from '../../../i18n'
import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'
import {type ReleaseDocument, useReleases} from '../../../store'
import {
  type ReleasesMetadata,
  useReleasesMetadata,
} from '../../../store/release/useReleasesMetadata'
import {ReleaseDetailsDialog} from '../../components/dialog/ReleaseDetailsDialog'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {Table, type TableRowProps} from '../components/Table/Table'
import {type TableSort} from '../components/Table/TableProvider'
import {releasesOverviewColumnDefs} from './ReleasesOverviewColumnDefs'

type Mode = 'open' | 'archived'

const MotionButton = motion(Button)
const MotionStudioButton = motion(StudioButton)

const DateFilterButton = ({filterDate, onClear}: {filterDate: Date; onClear: () => void}) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleOnExitComplete = useMemo(
    () => () => {
      setIsExiting(false)
      onClear()
    },
    [onClear],
  )

  if (!filterDate) return null

  return (
    <AnimatePresence onExitComplete={handleOnExitComplete}>
      {!isExiting && (
        <MotionButton
          initial={{width: 0, opacity: 0}}
          animate={{width: 'auto', opacity: 1}}
          exit={{width: 0, opacity: 0}}
          transition={{duration: 0.35, ease: 'easeInOut'}}
          iconRight={CloseIcon}
          mode="bleed"
          onClick={() => setIsExiting(true)}
          padding={2}
          selected
          text={format(filterDate, 'PPP')}
        />
      )}
    </AnimatePresence>
  )
}

const DATE_SEARCH_PARAM_KEY = 'date'
const DATE_SEARCH_PARAM_VALUE_FORMAT = 'yyyy-MM-dd'

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

// TODO: use the selected timezone rather than client
const getTimezoneAdjustedDateTimeRange = (date: Date) => {
  const {timeZone} = Intl.DateTimeFormat().resolvedOptions()

  return [startOfDay(date), endOfDay(date)].map((time) => zonedTimeToUtc(time, timeZone))
}

const ReleaseCalendarDay: CalendarProps['renderCalendarDay'] = (props) => {
  const {data: releases} = useReleases()
  const {date} = props

  const [startOfDayUTC, endOfDayUTC] = getTimezoneAdjustedDateTimeRange(date)

  const dayHasReleases = releases?.some((release) => {
    const releasePublishAt = release.publishAt || release.metadata.intendedPublishAt
    if (!releasePublishAt) return false

    const publishDateUTC = new Date(releasePublishAt)

    return (
      release.metadata.releaseType === 'scheduled' &&
      publishDateUTC >= startOfDayUTC &&
      publishDateUTC <= endOfDayUTC
    )
  })

  return <CalendarDay {...props} dateStyles={dayHasReleases ? {fontWeight: 700} : {}} />
}

const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishAt', direction: 'asc'}

const getInitialFilterDate = (router: RouterContextValue) => () => {
  const activeFilterDate = new URLSearchParams(router.state._searchParams).get(
    DATE_SEARCH_PARAM_KEY,
  )

  return activeFilterDate ? new Date(activeFilterDate) : undefined
}

export function ReleasesOverview() {
  const {data: releases, archivedReleases, loading: loadingReleases} = useReleases()
  const [releaseGroupMode, setReleaseGroupMode] = useState<Mode>('open')
  const router = useRouter()
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
  const {timeZone} = useTimeZone()
  const {currentGlobalBundle} = usePerspective()

  const getRowProps = useCallback(
    (datum: TableRelease): Partial<TableRowProps> =>
      datum.isDeleted
        ? {tone: 'transparent'}
        : {
            tone: currentGlobalBundle._id === datum._id ? getReleaseTone(datum) : 'default',
          },
    [currentGlobalBundle._id],
  )

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const hasReleases = releases.length > 0
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
    if (releaseGroupMode === 'archived' && !archivedReleases.length) {
      setReleaseGroupMode('open')
    }
  }, [releaseGroupMode, archivedReleases.length])

  const handleReleaseGroupModeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    ({currentTarget: {value: groupMode}}) => {
      setReleaseGroupMode(groupMode as Mode)
    },
    [],
  )

  const handleSelectFilterDate = useCallback((date?: Date) => {
    setReleaseFilterDate((prevFilterDate) =>
      prevFilterDate && date && isSameDay(prevFilterDate, date) ? undefined : date,
    )
  }, [])

  const clearFilterDate = useCallback(() => setReleaseFilterDate(undefined), [])

  useEffect(() => {
    router.navigate({
      _searchParams: releaseFilterDate
        ? [[DATE_SEARCH_PARAM_KEY, format(releaseFilterDate, DATE_SEARCH_PARAM_VALUE_FORMAT)]]
        : [],
    })
  }, [releaseFilterDate, router])

  const hasMounted = useRef(false)

  useEffect(() => {
    hasMounted.current = true
  }, [])

  const currentArchivedPicker = useMemo(() => {
    const groupModeButtonBaseProps = {
      disabled: loading || !hasReleases,
      mode: 'bleed' as ButtonMode,
      padding: 2,
      ...(hasMounted.current
        ? {
            initial: {opacity: 0},
            animate: {opacity: 1},
            transition: {duration: 0.4, ease: 'easeInOut'},
          }
        : {}),
    }
    return (
      <AnimatePresence>
        <MotionButton
          {...groupModeButtonBaseProps}
          key="open-group"
          onClick={handleReleaseGroupModeChange}
          selected={releaseGroupMode === 'open'}
          text={t('action.open')}
          value="open"
        />
        {/* StudioButton supports tooltip when button is disabled */}
        <MotionStudioButton
          {...groupModeButtonBaseProps}
          key="archived-group"
          disabled={groupModeButtonBaseProps.disabled || !archivedReleases.length}
          tooltipProps={{
            disabled: archivedReleases.length !== 0,
            content: t('no-archived-release'),
            placement: 'bottom',
          }}
          onClick={handleReleaseGroupModeChange}
          selected={releaseGroupMode === 'archived'}
          text={t('action.archived')}
          value="archived"
        />
      </AnimatePresence>
    )
  }, [
    loading,
    hasReleases,
    handleReleaseGroupModeChange,
    releaseGroupMode,
    t,
    archivedReleases.length,
  ])

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        disabled={isCreateReleaseDialogOpen}
        onClick={() => setIsCreateReleaseDialogOpen(true)}
        text={tCore('release.action.create-new')}
      />
    ),
    [isCreateReleaseDialogOpen, tCore],
  )

  const renderCreateReleaseDialog = () => {
    if (!isCreateReleaseDialogOpen) return null

    return (
      <ReleaseDetailsDialog
        onCancel={() => setIsCreateReleaseDialogOpen(false)}
        onSubmit={() => setIsCreateReleaseDialogOpen(false)}
        origin="release-plugin"
      />
    )
  }

  const renderRowActions = useCallback(({datum}: {datum: TableRelease | unknown}) => {
    const release = datum as TableRelease

    if (release.isDeleted) return null

    return <ReleaseMenuButton release={release} />
  }, [])

  const filteredReleases = useMemo(() => {
    if (!releaseFilterDate) return releaseGroupMode === 'open' ? tableReleases : archivedReleases

    const [startOfDayUTC, endOfDayUTC] = getTimezoneAdjustedDateTimeRange(releaseFilterDate)

    return tableReleases.filter((release) => {
      if (!release.publishAt || release.metadata.releaseType !== 'scheduled') return false

      const publishDateUTC = new Date(release.publishAt)
      return publishDateUTC >= startOfDayUTC && publishDateUTC <= endOfDayUTC
    })
  }, [releaseFilterDate, releaseGroupMode, tableReleases, archivedReleases])

  return (
    <Flex direction="row" flex={1} style={{height: '100%'}}>
      <Flex flex={1}>
        {(loading || hasReleases) && (
          <Flex flex="none">
            <Card borderRight flex="none" disabled>
              <CalendarFilter
                renderCalendarDay={ReleaseCalendarDay}
                selectedDate={releaseFilterDate}
                onSelect={handleSelectFilterDate}
              />
            </Card>
          </Flex>
        )}
        <Flex direction="column" flex={1} style={{position: 'relative'}}>
          <Card flex="none" padding={3}>
            <Flex align="flex-start" flex={1} gap={3}>
              <Stack padding={2} space={4}>
                <Text as="h1" size={1} weight="semibold">
                  {t('overview.title')}
                </Text>
              </Stack>
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
                />
                {loadingOrHasReleases && createReleaseButton}
              </Flex>
            </Flex>
          </Card>
          {!loading && !hasReleases && (
            <Container style={{margin: 0}} width={0}>
              <Stack space={5}>
                <Text data-testid="no-releases-info-text" muted size={2}>
                  {t('overview.description')}
                </Text>
                <Box>{createReleaseButton}</Box>
              </Stack>
            </Container>
          )}
          {(hasReleases || loadingTableData) && (
            <Box ref={scrollContainerRef} marginTop={3} overflow={'auto'}>
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
            </Box>
          )}
          {renderCreateReleaseDialog()}
        </Flex>
      </Flex>
    </Flex>
  )
}
