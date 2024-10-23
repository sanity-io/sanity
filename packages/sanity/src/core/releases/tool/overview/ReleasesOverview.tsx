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

export interface TableBundle extends ReleaseDocument {
  documentsMetadata?: ReleasesMetadata
  isDeleted?: boolean
}

const EMPTY_BUNDLE_GROUPS = {open: [], archived: []}
const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: '_createdAt', direction: 'desc'}

const getRowProps: TableProps<TableBundle, undefined>['rowProps'] = (datum) =>
  datum.isDeleted ? {tone: 'transparent'} : {}
export function ReleasesOverview() {
  const {data: releases, loading: loadingReleases, deletedReleases} = useReleases()
  const [bundleGroupMode, setBundleGroupMode] = useState<Mode>('open')
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)
  const bundleIds = useMemo(() => releases.map((bundle) => bundle._id), [releases])
  const {data: bundlesMetadata, loading: loadingBundlesMetadata} = useReleasesMetadata(bundleIds)
  const loading = loadingReleases || (loadingBundlesMetadata && !bundlesMetadata)
  const loadingTableData = loading || (!bundlesMetadata && Boolean(bundleIds.length))
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const hasReleases = releases.length > 0
  const loadingOrHasBundles = loading || hasReleases

  const tableBundles = useMemo<TableBundle[]>(() => {
    const deletedTableBundles = Object.values(deletedReleases).map((deletedBundle) => ({
      ...deletedBundle,
      isDeleted: true,
    }))

    if (!bundlesMetadata) return deletedTableBundles

    return [
      ...deletedTableBundles,
      ...releases.map((bundle) => ({
        ...bundle,
        documentsMetadata: bundlesMetadata[bundle._id] || {},
      })),
    ]
  }, [releases, bundlesMetadata, deletedReleases])

  const groupedBundles = useMemo(
    () =>
      tableBundles.reduce<{open: TableBundle[]; archived: TableBundle[]}>((groups, bundle) => {
        const isBundleArchived =
          bundle.archivedAt ||
          (bundle.publishedAt && isBefore(new Date(bundle.publishedAt), new Date()))
        const group = isBundleArchived ? 'archived' : 'open'

        return {...groups, [group]: [...groups[group], bundle]}
      }, EMPTY_BUNDLE_GROUPS) || EMPTY_BUNDLE_GROUPS,
    [tableBundles],
  )

  // switch to open mode if on archived mode and there are no archived releases
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
      </Flex>
    )
  }, [
    bundleGroupMode,
    groupedBundles.archived.length,
    handleBundleGroupModeChange,
    hasReleases,
    loading,
    t,
  ])

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        disabled={isCreateBundleDialogOpen}
        onClick={() => setIsCreateBundleDialogOpen(true)}
        text={tCore('release.action.create')}
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

  const applySearchTermToBundles = useCallback(
    (unfilteredData: TableBundle[], tableSearchTerm: string) => {
      return unfilteredData.filter((bundle) => {
        return bundle.title.toLocaleLowerCase().includes(tableSearchTerm.toLocaleLowerCase())
      })
    },
    [],
  )

  const renderRowActions = useCallback(({datum}: {datum: TableBundle | unknown}) => {
    const bundle = datum as TableBundle

    if (bundle.isDeleted) return null

    return <ReleaseMenuButton bundle={bundle} />
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
            {loadingOrHasBundles && currentArchivedPicker}
          </Flex>
          {loadingOrHasBundles && createReleaseButton}
        </Flex>
      </Container>
      {(hasReleases || loadingTableData) && (
        <Table<TableBundle>
          // for resetting filter and sort on table when mode changed
          key={bundleGroupMode}
          defaultSort={DEFAULT_RELEASES_OVERVIEW_SORT}
          loading={loadingTableData}
          data={groupedBundles[bundleGroupMode]}
          columnDefs={releasesOverviewColumnDefs(t)}
          searchFilter={applySearchTermToBundles}
          emptyState={t('no-releases')}
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          rowId="_id"
          rowActions={renderRowActions}
          rowProps={getRowProps}
          scrollContainerRef={scrollContainerRef}
        />
      )}
      {renderCreateBundleDialog()}
    </Flex>
  )
}
