import {AddIcon, ChevronDownIcon, CloseIcon, EarthGlobeIcon} from '@sanity/icons'
import {Box, type ButtonMode, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {endOfDay, format, isSameDay, startOfDay} from 'date-fns'
import {zonedTimeToUtc} from 'date-fns-tz'
import {
  Fragment,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {usePerspective} from 'sanity'
import {type RouterContextValue, useRouter} from 'sanity/router'

import {Button, Button as StudioButton} from '../../../../ui-components'
import {CalendarDay} from '../../../../ui-components/inputs/DateFilters/calender/CalendarDay'
import {
  CalendarFilter,
  type CalendarProps,
} from '../../../../ui-components/inputs/DateFilters/calender/CalendarFilter'
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

const EMPTY_RELEASE_GROUPS = {open: [], archived: []}
const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishedAt', direction: 'asc'}

const getInitialFilterDate = (router: RouterContextValue) => () => {
  const activeFilterDate = new URLSearchParams(router.state._searchParams).get(
    DATE_SEARCH_PARAM_KEY,
  )

  return activeFilterDate ? new Date(activeFilterDate) : undefined
}

export function ReleasesOverview() {
  const {data: releases, loading: loadingReleases, deletedReleases} = useReleases()
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
        : {tone: currentGlobalBundle._id === datum._id ? getReleaseTone(datum) : 'default'},
    [currentGlobalBundle._id],
  )

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const hasReleases = releases.length > 0
  const loadingOrHasReleases = loading || hasReleases

  const tableReleases = useMemo<TableRelease[]>(() => {
    const deletedTableReleases = Object.values(deletedReleases).map((deletedRelease) => ({
      ...deletedRelease,
      publishAt: deletedRelease.publishAt || deletedRelease.metadata.intendedPublishAt,
      isDeleted: true,
    }))

    if (!hasReleases || !releasesMetadata) return deletedTableReleases

    return [
      ...deletedTableReleases,
      ...releases.map((release) => ({
        ...release,
        publishAt: release.publishAt || release.metadata.intendedPublishAt,
        documentsMetadata: releasesMetadata[release._id] || {},
      })),
    ]
  }, [deletedReleases, hasReleases, releasesMetadata, releases])

  const groupedReleases = useMemo(
    () =>
      tableReleases.reduce<{open: TableRelease[]; archived: TableRelease[]}>((groups, release) => {
        const isReleaseArchived = release.state === 'archived' || release.state === 'published'
        const group = isReleaseArchived ? 'archived' : 'open'

        return {
          ...groups,
          [group]: [...groups[group], release],
        }
      }, EMPTY_RELEASE_GROUPS) || EMPTY_RELEASE_GROUPS,
    [tableReleases],
  )

  // switch to open mode if on archived mode and there are no archived releases
  useEffect(() => {
    if (releaseGroupMode === 'archived' && !groupedReleases.archived.length) {
      setReleaseGroupMode('open')
    }
  }, [releaseGroupMode, groupedReleases.archived.length])

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

  const currentFilterDate = useMemo(() => {
    if (!releaseFilterDate) return null

    return (
      <Button
        iconRight={CloseIcon}
        mode="bleed"
        onClick={clearFilterDate}
        padding={2}
        selected
        text={format(releaseFilterDate, 'PPP')}
      />
    )
  }, [releaseFilterDate, clearFilterDate])

  useEffect(() => {
    router.navigate({
      _searchParams: releaseFilterDate
        ? [[DATE_SEARCH_PARAM_KEY, format(releaseFilterDate, DATE_SEARCH_PARAM_VALUE_FORMAT)]]
        : [],
    })
  }, [releaseFilterDate, router])

  const currentArchivedPicker = useMemo(() => {
    const groupModeButtonBaseProps = {
      disabled: loading || !hasReleases,
      mode: 'bleed' as ButtonMode,
      padding: 2,
    }
    return (
      <Fragment>
        <Button
          {...groupModeButtonBaseProps}
          onClick={handleReleaseGroupModeChange}
          selected={releaseGroupMode === 'open'}
          text={t('action.open')}
          value="open"
        />
        {/* StudioButton supports tooltip when button is disabled */}
        <StudioButton
          {...groupModeButtonBaseProps}
          disabled={groupModeButtonBaseProps.disabled || !groupedReleases.archived.length}
          tooltipProps={{
            disabled: groupedReleases.archived.length !== 0,
            content: t('no-archived-release'),
            placement: 'bottom',
          }}
          onClick={handleReleaseGroupModeChange}
          selected={releaseGroupMode === 'archived'}
          text={t('action.archived')}
          value="archived"
        />
      </Fragment>
    )
  }, [
    releaseGroupMode,
    groupedReleases.archived.length,
    handleReleaseGroupModeChange,
    hasReleases,
    loading,
    t,
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
    if (!releaseFilterDate) return groupedReleases[releaseGroupMode]

    const [startOfDayUTC, endOfDayUTC] = getTimezoneAdjustedDateTimeRange(releaseFilterDate)

    return tableReleases.filter((release) => {
      if (!release.publishAt || release.metadata.releaseType !== 'scheduled') return false

      const publishDateUTC = new Date(release.publishAt)
      return publishDateUTC >= startOfDayUTC && publishDateUTC <= endOfDayUTC
    })
  }, [releaseGroupMode, groupedReleases, releaseFilterDate, tableReleases])

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
        <Flex direction={'column'} flex={1} style={{position: 'relative'}}>
          <Card flex="none" padding={3}>
            <Flex align="flex-start" flex={1} gap={3}>
              <Stack padding={2} space={4}>
                <Text as="h1" size={1} weight="semibold">
                  {t('overview.title')}
                </Text>
              </Stack>
              <Flex flex={1} gap={1}>
                {loadingOrHasReleases &&
                  (releaseFilterDate ? currentFilterDate : currentArchivedPicker)}
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
