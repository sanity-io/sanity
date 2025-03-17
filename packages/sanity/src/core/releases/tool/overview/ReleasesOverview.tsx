import {AddIcon, ChevronDownIcon, EarthGlobeIcon} from '@sanity/icons'
import {Box, type ButtonMode, Card, Flex, Inline, Stack, Text, useMediaIndex} from '@sanity/ui'
import {format, isSameDay} from 'date-fns'
import {AnimatePresence, motion} from 'framer-motion'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type SearchParam, useRouter} from 'sanity/router'

import {Tooltip} from '../../../../ui-components'
import {Button} from '../../../../ui-components/button/Button'
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
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleasePermissions} from '../../store/useReleasePermissions'
import {type ReleasesMetadata, useReleasesMetadata} from '../../store/useReleasesMetadata'
import {getReleaseTone} from '../../util/getReleaseTone'
import {getReleaseDefaults} from '../../util/util'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {Table, type TableRowProps} from '../components/Table/Table'
import {type TableSort} from '../components/Table/TableProvider'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'
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

const MotionButton = motion.create(Button)

const DATE_SEARCH_PARAM_VALUE_FORMAT = 'yyyy-MM-dd'

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishAt', direction: 'asc'}
const DEFAULT_ARCHIVED_RELEASES_OVERVIEW_SORT: TableSort = {
  column: 'publishedAt',
  direction: 'desc',
}
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

  const {createRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)
  const [isPendingGuardResponse, setIsPendingGuardResponse] = useState<boolean>(false)

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
  const hasNoReleases = !loading && !hasReleases

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
        <MotionButton
          {...groupModeButtonBaseProps}
          key="open-group"
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

  const handleOnClickCreateRelease = useCallback(async () => {
    setIsPendingGuardResponse(true)
    await guardWithReleaseLimitUpsell(() => {
      setIsCreateReleaseDialogOpen(true)
    })
    setIsPendingGuardResponse(false)
  }, [guardWithReleaseLimitUpsell])

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        disabled={
          isPendingGuardResponse ||
          !hasCreatePermission ||
          isCreateReleaseDialogOpen ||
          mode === 'disabled'
        }
        onClick={handleOnClickCreateRelease}
        text={tCore('release.action.create-new')}
        tooltipProps={{
          disabled: hasCreatePermission === true,
          content: tCore('release.action.permission.error'),
        }}
      />
    ),
    [
      isPendingGuardResponse,
      hasCreatePermission,
      isCreateReleaseDialogOpen,
      mode,
      handleOnClickCreateRelease,
      tCore,
    ],
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
        (releaseGroupMode === 'active'
          ? release.documentsMetadata?.documentCount
          : release.finalDocumentStates?.length) ?? 0

      return <ReleaseMenuButton release={release} documentsCount={documentsCount} />
    },
    [releaseGroupMode],
  )

  const filteredReleases = useMemo(() => {
    if (!releaseFilterDate) return releaseGroupMode === 'active' ? tableReleases : archivedReleases

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

  const tableColumns = useMemo(
    () => releasesOverviewColumnDefs(t, releaseGroupMode),
    [releaseGroupMode, t],
  )

  const NoRelease = () => {
    return (
      <Flex
        direction="column"
        flex={1}
        justify={hasNoReleases ? 'center' : 'flex-start'}
        align={hasNoReleases ? 'center' : 'flex-start'}
        style={{position: 'relative'}}
      >
        <Flex gap={3} direction="column" style={{maxWidth: '300px'}}>
          <ReleaseIllustration />
          <Text as="h1" size={1} weight="semibold" data-testid="no-releases-info-text">
            {t('overview.title')}
          </Text>
          <Text size={1} muted>
            {t('overview.description')}
          </Text>
          <Inline space={2}>
            {createReleaseButton}
            <Button
              as="a"
              href="https://www.sanity.io/docs/content-releases"
              target="_blank"
              mode="ghost"
              onClick={handleOnClickCreateRelease}
              text={t('overview.action.documentation')}
            />
          </Inline>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex direction="row" flex={1} style={{height: '100%'}}>
      <Flex flex={1}>
        {showCalendar && renderCalendarFilter}

        {hasNoReleases ? (
          <NoRelease />
        ) : (
          <>
            <Flex direction="column" flex={1} style={{position: 'relative'}}>
              <Card flex="none" padding={3}>
                <Flex align="center" flex={1} gap={3}>
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
                        <DateFilterButton
                          filterDate={releaseFilterDate}
                          onClear={clearFilterDate}
                        />
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
              <Box ref={scrollContainerRef} marginTop={3} overflow={'auto'}>
                {(loading || hasReleases) && (
                  <Table<TableRelease>
                    // for resetting filter and sort on table when filer changed
                    key={releaseFilterDate ? 'by_date' : releaseGroupMode}
                    defaultSort={
                      releaseGroupMode === 'archived'
                        ? DEFAULT_ARCHIVED_RELEASES_OVERVIEW_SORT
                        : DEFAULT_RELEASES_OVERVIEW_SORT
                    }
                    loading={loadingTableData}
                    data={filteredReleases}
                    columnDefs={tableColumns}
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
            </Flex>
            {renderCreateReleaseDialog()}
          </>
        )}
      </Flex>
    </Flex>
  )
}
