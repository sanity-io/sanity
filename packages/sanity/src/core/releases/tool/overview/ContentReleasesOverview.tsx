import {type ReleaseDocument} from '@sanity/client'
import {Box} from '@sanity/ui'
import {type ReactElement, useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleasesMetadata} from '../../store/useReleasesMetadata'
import {Table, type TableRowProps} from '../components/Table/Table'
import {type TableSort} from '../components/Table/TableProvider'
import {type Mode} from './queryParamUtils'
import {ReleaseMenuButtonWrapper} from './ReleaseMenuButtonWrapper'
import {ReleasesEmptyState} from './ReleasesEmptyState'
import {releasesOverviewColumnDefs} from './ReleasesOverviewColumnDefs'
import {SchedulesUpsell} from './SchedulesUpsell'

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishAt', direction: 'asc'}
const DEFAULT_ARCHIVED_RELEASES_OVERVIEW_SORT: TableSort = {
  column: 'lastActivity',
  direction: 'desc',
}

interface ContentReleasesOverviewProps {
  releases: ReleaseDocument[]
  archivedReleases: ReleaseDocument[]
  releaseGroupMode: Mode
  loading: boolean
  loadingTableData: boolean
  releasesMetadata: Record<string, ReleasesMetadata> | null | undefined
  releaseFilterDate: Date | undefined
  scrollContainerRef: HTMLDivElement | null
  setScrollContainerRef: (ref: HTMLDivElement | null) => void
  getRowProps: (datum: TableRelease) => Partial<TableRowProps>
  getTimezoneAdjustedDateTimeRange: (date: Date) => [Date, Date]
  createReleaseButton: ReactElement | null
}

export function ContentReleasesOverview({
  releases,
  archivedReleases,
  releaseGroupMode,
  loading,
  loadingTableData,
  releasesMetadata,
  releaseFilterDate,
  scrollContainerRef,
  setScrollContainerRef,
  getRowProps,
  getTimezoneAdjustedDateTimeRange,
  createReleaseButton,
}: ContentReleasesOverviewProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {mode: releasesUpsellMode} = useReleasesUpsell()

  const hasReleases = releases.length > 0 || archivedReleases.length > 0
  const hasNoReleases = !loading && !hasReleases

  const tableReleases = useMemo<TableRelease[]>(() => {
    if (!hasReleases || !releasesMetadata) return []
    return releases.map((release) => ({
      ...release,
      publishAt: release.publishAt || release.metadata.intendedPublishAt,
      documentsMetadata: releasesMetadata[release._id] || {},
    }))
  }, [hasReleases, releasesMetadata, releases])

  const filteredReleases = useMemo(() => {
    if (!releaseFilterDate) {
      return releaseGroupMode === 'active' ? tableReleases : archivedReleases
    }

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

  const renderRowActions = useCallback(
    ({datum}: {datum: TableRelease | unknown}) => {
      const release = datum as TableRelease

      if (release.isDeleted || release.isLoading) return null

      const documentsCount =
        (releaseGroupMode === 'active'
          ? release.documentsMetadata?.documentCount
          : release.finalDocumentStates?.length) ?? 0

      return <ReleaseMenuButtonWrapper release={release} documentsCount={documentsCount} />
    },
    [releaseGroupMode],
  )

  const tableColumns = useMemo(
    () => releasesOverviewColumnDefs(t, releaseGroupMode),
    [releaseGroupMode, t],
  )

  const releasesEmptyStateComponent = useCallback(
    () => <ReleasesEmptyState createReleaseButton={createReleaseButton} />,
    [createReleaseButton],
  )

  const tableEmptyState = useMemo(() => {
    if (releaseGroupMode === 'active') {
      return releasesEmptyStateComponent
    }
    // Use default text empty state for archived view
    return t('no-releases')
  }, [releaseGroupMode, releasesEmptyStateComponent, t])

  const isArchivedReleasesView = releaseGroupMode === 'archived'
  const defaultTableSort = isArchivedReleasesView
    ? DEFAULT_ARCHIVED_RELEASES_OVERVIEW_SORT
    : DEFAULT_RELEASES_OVERVIEW_SORT

  if (hasNoReleases) {
    return (
      <>
        {releasesUpsellMode === 'upsell' ? (
          <SchedulesUpsell cardinalityView="releases" />
        ) : (
          <ReleasesEmptyState createReleaseButton={createReleaseButton} />
        )}
      </>
    )
  }

  return (
    <Box ref={setScrollContainerRef} marginTop={3} overflow={'auto'}>
      <Table<TableRelease>
        // for resetting filter and sort on table when filter changed
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
  )
}
