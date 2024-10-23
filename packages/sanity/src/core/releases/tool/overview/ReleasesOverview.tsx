import {AddIcon} from '@sanity/icons'
import {Box, type ButtonMode, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {isBefore} from 'date-fns'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button, Button as StudioButton} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {type ReleaseDocument, useReleases} from '../../../store'
import {
  type ReleasesMetadata,
  useReleasesMetadata,
} from '../../../store/release/useReleasesMetadata'
import {ReleaseDetailsDialog} from '../../components/dialog/ReleaseDetailsDialog'
import {releasesLocaleNamespace} from '../../i18n'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {Table, type TableProps} from '../components/Table/Table'
import {type TableSort} from '../components/Table/TableProvider'
import {releasesOverviewColumnDefs} from './ReleasesOverviewColumnDefs'

type Mode = 'open' | 'archived'

export interface TableRelease extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

const EMPTY_RELEASE_GROUPS = {open: [], archived: []}
const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: '_createdAt', direction: 'desc'}

const getRowProps: TableProps<TableRelease, undefined>['rowProps'] = (datum) =>
  datum.isDeleted ? {tone: 'transparent'} : {}
export function ReleasesOverview() {
  const {data: releases, loading: loadingReleases, deletedReleases} = useReleases()
  const [releaseGroupMode, setReleaseGroupMode] = useState<Mode>('open')
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)
  const releaseIds = useMemo(() => releases.map((release) => release._id), [releases])
  const {data: releasesMetadata, loading: loadingReleasesMetadata} = useReleasesMetadata(releaseIds)
  const loading = loadingReleases || (loadingReleasesMetadata && !releasesMetadata)
  const loadingTableData = loading || (!releasesMetadata && Boolean(releaseIds.length))
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const hasReleases = releases.length > 0
  const loadingOrHasReleases = loading || hasReleases

  const tableReleases = useMemo<TableRelease[]>(() => {
    const deletedTableReleases = Object.values(deletedReleases).map((deletedRelease) => ({
      ...deletedRelease,
      isDeleted: true,
    }))

    if (!hasReleases || !releasesMetadata) return deletedTableReleases

    return [
      ...deletedTableReleases,
      ...releases.map((release) => ({
        ...release,
        documentsMetadata: releasesMetadata[release._id] || {},
      })),
    ]
  }, [deletedReleases, hasReleases, releasesMetadata, releases])

  const groupedReleases = useMemo(
    () =>
      tableReleases.reduce<{open: TableRelease[]; archived: TableRelease[]}>(
        (groups, tableRelease) => {
          const isReleaseArchived =
            tableRelease.archivedAt ||
            (tableRelease.publishedAt && isBefore(new Date(tableRelease.publishedAt), new Date()))
          const group = isReleaseArchived ? 'archived' : 'open'

          return {...groups, [group]: [...groups[group], tableRelease]}
        },
        EMPTY_RELEASE_GROUPS,
      ) || EMPTY_RELEASE_GROUPS,
    [tableReleases],
  )

  // switch to open mode if on archived mode and there are no archived releases
  useEffect(() => {
    if (releaseGroupMode === 'archived' && !groupedReleases.archived.length) {
      setReleaseGroupMode('open')
    }
  }, [releaseGroupMode, groupedReleases.archived.length])

  const handleReleaseModeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    ({currentTarget: {value: groupMode}}) => {
      setReleaseGroupMode(groupMode as Mode)
    },
    [],
  )

  const currentArchivedPicker = useMemo(() => {
    const groupModeButtonBaseProps = {
      disabled: loading || !hasReleases,
      mode: 'bleed' as ButtonMode,
      padding: 2,
    }
    return (
      <Flex flex="none" gap={1}>
        <Button
          {...groupModeButtonBaseProps}
          onClick={handleReleaseModeChange}
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
          onClick={handleReleaseModeChange}
          selected={releaseGroupMode === 'archived'}
          text={t('action.archived')}
          value="archived"
        />
      </Flex>
    )
  }, [
    releaseGroupMode,
    groupedReleases.archived.length,
    handleReleaseModeChange,
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
        text={tCore('release.action.create')}
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

  const applySearchTermToReleases = useCallback(
    (unfilteredData: TableRelease[], tableSearchTerm: string) => {
      return unfilteredData.filter((release) => {
        return release.title.toLocaleLowerCase().includes(tableSearchTerm.toLocaleLowerCase())
      })
    },
    [],
  )

  const renderRowActions = useCallback(({datum}: {datum: TableRelease | unknown}) => {
    const release = datum as TableRelease

    if (release.isDeleted) return null

    return <ReleaseMenuButton bundle={release} />
  }, [])

  return (
    <Flex paddingX={4} height="fill" direction="column" ref={scrollContainerRef} overflow={'auto'}>
      <Container width={3} paddingY={6}>
        <Flex align="flex-start" gap={2} paddingBottom={2}>
          <Flex align="flex-start" flex={1} gap={4}>
            <Stack paddingY={1} space={4}>
              <Heading as="h1" size={2} style={{margin: '1px 0'}}>
                {t('overview.title')}
              </Heading>
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
            </Stack>
            {loadingOrHasReleases && currentArchivedPicker}
          </Flex>
          {loadingOrHasReleases && createReleaseButton}
        </Flex>
      </Container>
      {(hasReleases || loadingTableData) && (
        <Table<TableRelease>
          // for resetting filter and sort on table when mode changed
          key={releaseGroupMode}
          defaultSort={DEFAULT_RELEASES_OVERVIEW_SORT}
          loading={loadingTableData}
          data={groupedReleases[releaseGroupMode]}
          columnDefs={releasesOverviewColumnDefs(t)}
          searchFilter={applySearchTermToReleases}
          emptyState={t('no-releases')}
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          rowId="_id"
          rowActions={renderRowActions}
          rowProps={getRowProps}
          scrollContainerRef={scrollContainerRef}
        />
      )}
      {renderCreateReleaseDialog()}
    </Flex>
  )
}
