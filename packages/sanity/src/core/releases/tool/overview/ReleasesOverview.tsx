import {AddIcon, ChevronDownIcon, CloseIcon, EarthGlobeIcon} from '@sanity/icons'
import {Box, type ButtonMode, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {endOfDay, format, isBefore, isSameDay, startOfDay} from 'date-fns'
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
import {containsBundles} from '../../types/bundle'
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

const ReleaseCalendarDay: CalendarProps['renderCalendarDay'] = (props) => {
  const {data: bundles} = useReleases()
  const {date} = props
  const {timeZone} = Intl.DateTimeFormat().resolvedOptions()
  const localStart = startOfDay(date) // Get start of the day in local time
  const localEnd = endOfDay(date) // Get end of the day in local time

  // Step 2: Convert local times to UTC
  const startOfDayUTC = zonedTimeToUtc(localStart, timeZone)
  const endOfDayUTC = zonedTimeToUtc(localEnd, timeZone)

  const dayHasReleases = bundles?.some((bundle) => {
    if (!bundle.publishedAt) return false

    const publishDateUTC = new Date(bundle.publishedAt)

    return (
      bundle.releaseType === 'scheduled' &&
      publishDateUTC >= startOfDayUTC &&
      publishDateUTC <= endOfDayUTC
    )
  })

  return <CalendarDay {...props} dateStyles={dayHasReleases ? {fontWeight: 700} : {}} />
}

const EMPTY_BUNDLE_GROUPS = {open: [], archived: []}
const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishedAt', direction: 'asc'}

const getInitialFilterDate = (router: RouterContextValue) => () => {
  const activeFilterDate = new URLSearchParams(router.state._searchParams).get(
    DATE_SEARCH_PARAM_KEY,
  )

  return activeFilterDate ? new Date(activeFilterDate) : undefined
}

export function ReleasesOverview() {
  const {data: bundles, loading: loadingBundles, deletedReleases} = useReleases()
  // const bundles = []
  const [bundleGroupMode, setBundleGroupMode] = useState<Mode>('open')
  const router = useRouter()
  const [releaseFilterDate, setReleaseFilterDate] = useState<Date | undefined>(
    getInitialFilterDate(router),
  )
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)
  const bundleIds = useMemo(() => bundles?.map((bundle) => bundle._id) || [], [bundles])
  const {data: bundlesMetadata, loading: loadingBundlesMetadata} = useReleasesMetadata(bundleIds)
  const loading = loadingBundles || (loadingBundlesMetadata && !bundlesMetadata)
  const loadingTableData = loading || (!bundlesMetadata && Boolean(bundleIds.length))
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {timeZone: uTx} = useTimeZone()
  const {currentGlobalBundle} = usePerspective()

  const getRowProps = useCallback(
    (datum: TableRelease): Partial<TableRowProps> =>
      datum.isDeleted
        ? {tone: 'transparent'}
        : {tone: currentGlobalBundle._id === datum._id ? getReleaseTone(datum) : 'default'},
    [currentGlobalBundle._id],
  )

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const hasBundles = bundles && containsBundles(bundles)
  const loadingOrHasBundles = loading || hasBundles

  const tableBundles = useMemo<TableRelease[]>(() => {
    const deletedTableBundles = Object.values(deletedReleases).map((deletedBundle) => ({
      ...deletedBundle,
      isDeleted: true,
    }))

    if (!bundles || !bundlesMetadata) return deletedTableBundles

    return [
      ...deletedTableBundles,
      ...bundles.map((bundle) => ({
        ...bundle,
        documentsMetadata: bundlesMetadata[bundle._id] || {},
      })),
    ]
  }, [bundles, bundlesMetadata, deletedReleases])

  const groupedBundles = useMemo(
    () =>
      tableBundles.reduce<{open: TableRelease[]; archived: TableRelease[]}>((groups, bundle) => {
        const isBundleArchived =
          bundle.archivedAt ||
          (bundle.publishedAt && isBefore(new Date(bundle.publishedAt), new Date()))
        const group = isBundleArchived ? 'archived' : 'open'

        return {
          ...groups,
          [group]: [...groups[group], {...bundle, publishAt: '2024-10-24T23:10:31Z'}],
        }
      }, EMPTY_BUNDLE_GROUPS) || EMPTY_BUNDLE_GROUPS,
    [tableBundles],
  )

  // switch to open mode if on archived mode and there are no archived bundles
  useEffect(() => {
    if (bundleGroupMode === 'archived' && !groupedBundles.archived.length) {
      setBundleGroupMode('open')
    }
  }, [bundleGroupMode, groupedBundles.archived.length])

  const handleBundleGroupModeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    ({currentTarget: {value: groupMode}}) => {
      setBundleGroupMode(groupMode as Mode)
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
      disabled: loading || !hasBundles,
      mode: 'bleed' as ButtonMode,
      padding: 2,
    }
    return (
      <Fragment>
        <Button
          {...groupModeButtonBaseProps}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'open'}
          text={t('action.open')}
          value="open"
        />
        {/* StudioButton supports tooltip when button is disabled */}
        <StudioButton
          {...groupModeButtonBaseProps}
          disabled={groupModeButtonBaseProps.disabled || !groupedBundles.archived.length}
          tooltipProps={{
            disabled: groupedBundles.archived.length !== 0,
            content: t('no-archived-release'),
            placement: 'bottom',
          }}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'archived'}
          text={t('action.archived')}
          value="archived"
        />
      </Fragment>
    )
  }, [
    bundleGroupMode,
    groupedBundles.archived.length,
    handleBundleGroupModeChange,
    hasBundles,
    loading,
    t,
  ])

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        disabled={isCreateBundleDialogOpen}
        onClick={() => setIsCreateBundleDialogOpen(true)}
        text={tCore('release.action.create-new')}
      />
    ),
    [isCreateBundleDialogOpen, tCore],
  )

  const renderCreateBundleDialog = () => {
    if (!isCreateBundleDialogOpen) return null

    return (
      <ReleaseDetailsDialog
        onCancel={() => setIsCreateBundleDialogOpen(false)}
        onSubmit={() => setIsCreateBundleDialogOpen(false)}
        origin="release-plugin"
      />
    )
  }

  const renderRowActions = useCallback(({datum}: {datum: TableRelease | unknown}) => {
    const bundle = datum as TableRelease

    if (bundle.isDeleted) return null

    return <ReleaseMenuButton bundle={bundle} />
  }, [])

  const filteredReleases = useMemo(() => {
    if (!releaseFilterDate) return groupedBundles[bundleGroupMode]

    const {timeZone} = Intl.DateTimeFormat().resolvedOptions()
    const localStart = startOfDay(new Date(releaseFilterDate)) // Get start of the day in local time
    const localEnd = endOfDay(new Date(releaseFilterDate)) // Get end of the day in local time

    // Step 2: Convert local times to UTC
    const startOfDayUTC = zonedTimeToUtc(localStart, timeZone)
    const endOfDayUTC = zonedTimeToUtc(localEnd, timeZone)

    return tableBundles.filter((bundle) => {
      if (!bundle.publishedAt || bundle.releaseType !== 'scheduled') return false

      const publishDateUTC = new Date(bundle.publishedAt)
      return publishDateUTC >= startOfDayUTC && publishDateUTC <= endOfDayUTC
    })
  }, [bundleGroupMode, groupedBundles, releaseFilterDate, tableBundles])

  return (
    <Flex direction="row" flex={1} style={{height: '100%'}}>
      <Flex flex={1}>
        {(loading || hasBundles) && (
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
                {loadingOrHasBundles &&
                  (releaseFilterDate ? currentFilterDate : currentArchivedPicker)}
              </Flex>
              <Flex flex="none" gap={2}>
                <Button
                  icon={EarthGlobeIcon}
                  iconRight={ChevronDownIcon}
                  mode="bleed"
                  padding={2}
                  text={`${uTx.abbreviation} (${uTx.namePretty})`}
                />
                {loadingOrHasBundles && createReleaseButton}
              </Flex>
            </Flex>
          </Card>
          {!loading && !hasBundles && (
            <Container style={{margin: 0}} width={0}>
              <Stack space={5}>
                <Text data-testid="no-releases-info-text" muted size={2}>
                  {t('overview.description')}
                </Text>
                <Box>{createReleaseButton}</Box>
              </Stack>
            </Container>
          )}
          {(hasBundles || loadingTableData) && (
            <Box ref={scrollContainerRef} marginTop={3} overflow={'auto'}>
              <Table<TableRelease>
                // for resetting filter and sort on table when filer changed
                key={releaseFilterDate ? 'by_date' : bundleGroupMode}
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
          {renderCreateBundleDialog()}
        </Flex>
      </Flex>
    </Flex>
  )
}
