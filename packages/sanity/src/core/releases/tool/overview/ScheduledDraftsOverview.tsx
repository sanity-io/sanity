import {type ReleaseDocument} from '@sanity/client'
import {Box} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {useScheduledDraftsEnabled} from '../../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {useWorkspace} from '../../../studio/workspace'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleasesMetadata} from '../../store/useReleasesMetadata'
import {Table, type TableRowProps} from '../components/Table/Table'
import {type TableSort} from '../components/Table/TableProvider'
import {ConfirmActiveScheduledDraftsBanner} from './ConfirmActiveScheduledDraftsBanner'
import {DraftsDisabledBanner} from './DraftsDisabledBanner'
import {type Mode} from './queryParamUtils'
import {ScheduledDraftMenuButtonWrapper} from './ScheduledDraftMenuButtonWrapper'
import {ScheduledDraftsEmptyState} from './ScheduledDraftsEmptyState'
import {scheduledDraftsOverviewColumnDefs} from './ScheduledDraftsOverviewColumnDefs'
import {SchedulesUpsell} from './SchedulesUpsell'

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: 'publishAt', direction: 'asc'}

interface ScheduledDraftsOverviewProps {
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
  allReleases: ReleaseDocument[]
}

export function ScheduledDraftsOverview({
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
  allReleases,
}: ScheduledDraftsOverviewProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {mode: scheduledDraftsMode} = useSingleDocReleaseEnabled()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {document} = useWorkspace()
  const isDraftModelEnabled = document?.drafts?.enabled

  const hasReleases = releases.length > 0 || archivedReleases.length > 0
  const hasNoReleases = !loading && !hasReleases

  // Banner that shows when drafts mode is disabled, or scheduled drafts are disabled
  // but there are still scheduled drafts
  const showDraftsDisabledBanner = !isDraftModelEnabled || !isScheduledDraftsEnabled

  const showConfirmActiveScheduledDraftsBanner = releases.some(
    (release) => release.state === 'active' && isCardinalityOneRelease(release),
  )

  const tableReleases = useMemo<TableRelease[]>(() => {
    if (!hasReleases || !releasesMetadata) return []
    return releases.map((release) => ({
      ...release,
      publishAt: release.publishAt || release.metadata.intendedPublishAt,
      documentsMetadata: releasesMetadata[release._id] || {},
    }))
  }, [hasReleases, releasesMetadata, releases])

  const filteredReleases = useMemo(() => {
    // Filter out active releases for drafts view
    const filterActiveReleases = (items: TableRelease[]) =>
      items.filter((release) => release.state !== 'active')

    if (!releaseFilterDate) {
      return filterActiveReleases(releaseGroupMode === 'active' ? tableReleases : archivedReleases)
    }

    const [startOfDayForTimeZone, endOfDayForTimeZone] =
      getTimezoneAdjustedDateTimeRange(releaseFilterDate)

    const dateFiltered = tableReleases.filter((release) => {
      if (!release.publishAt || release.metadata.releaseType !== 'scheduled') return false
      const publishDateUTC = new Date(release.publishAt)
      return publishDateUTC >= startOfDayForTimeZone && publishDateUTC <= endOfDayForTimeZone
    })

    return filterActiveReleases(dateFiltered)
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

      return <ScheduledDraftMenuButtonWrapper release={release} releaseGroupMode={releaseGroupMode} />
    },
    [releaseGroupMode],
  )

  const tableColumns = useMemo(
    () => scheduledDraftsOverviewColumnDefs(t, releaseGroupMode),
    [releaseGroupMode, t],
  )

  if (hasNoReleases) {
    return (
      <>
        {scheduledDraftsMode === 'upsell' ? (
          <SchedulesUpsell cardinalityView="drafts" />
        ) : (
          <ScheduledDraftsEmptyState />
        )}
      </>
    )
  }

  return (
    <>
      {showDraftsDisabledBanner && (
        <DraftsDisabledBanner
          isDraftModelEnabled={isDraftModelEnabled}
          isScheduledDraftsEnabled={isScheduledDraftsEnabled}
          allReleases={allReleases}
        />
      )}
      {showConfirmActiveScheduledDraftsBanner && (
        <ConfirmActiveScheduledDraftsBanner releases={releases} />
      )}

      <Box
        ref={setScrollContainerRef}
        marginTop={showDraftsDisabledBanner || showConfirmActiveScheduledDraftsBanner ? 0 : 3}
        overflow={'auto'}
      >
        <Table<TableRelease>
          // for resetting filter and sort on table when filter changed
          key={releaseFilterDate ? 'by_date' : releaseGroupMode}
          defaultSort={DEFAULT_RELEASES_OVERVIEW_SORT}
          loading={loadingTableData}
          data={filteredReleases}
          columnDefs={tableColumns}
          emptyState={t('no-scheduled-drafts')}
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          rowId="_id"
          rowActions={renderRowActions}
          rowProps={getRowProps}
          scrollContainerRef={scrollContainerRef}
          hideTableInlinePadding
        />
      </Box>
    </>
  )
}
