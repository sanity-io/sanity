import {AddIcon} from '@sanity/icons'
import {Box, Button, type ButtonMode, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {isBefore} from 'date-fns'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button as StudioButton} from '../../../../ui-components'
import {BundleDetailsDialog} from '../../../bundles/components/dialog/BundleDetailsDialog'
import {type BundleDocument, useBundles} from '../../../store'
import {BundleMenuButton} from '../../components/BundleMenuButton/BundleMenuButton'
import {Table, type TableProps} from '../../components/Table/Table'
import {type TableSort} from '../../components/Table/TableProvider'
import {containsBundles} from '../../types/bundle'
import {type BundlesMetadata, useBundlesMetadata} from '../useBundlesMetadata'
import {releasesOverviewColumnDefs} from './ReleasesOverviewColumnDefs'

type Mode = 'open' | 'archived'

export interface TableBundle extends BundleDocument {
  documentsMetadata?: BundlesMetadata
  isDeleted?: boolean
}

const EMPTY_BUNDLE_GROUPS = {open: [], archived: []}
const DEFAULT_RELEASES_OVERVIEW_SORT: TableSort = {column: '_createdAt', direction: 'desc'}

const getRowProps: TableProps<TableBundle, undefined>['rowProps'] = (datum) =>
  datum.isDeleted ? {tone: 'transparent'} : {}

export function ReleasesOverview() {
  const {data: bundles, loading: loadingBundles, deletedBundles} = useBundles()
  const [bundleGroupMode, setBundleGroupMode] = useState<Mode>('open')
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)
  const bundleSlugs = useMemo(() => bundles?.map((bundle) => bundle.slug) || [], [bundles])
  const {data: bundlesMetadata, loading: loadingBundlesMetadata} = useBundlesMetadata(bundleSlugs)
  const loading = loadingBundles || (loadingBundlesMetadata && !bundlesMetadata)
  const loadingTableData = loading || (!bundlesMetadata && Boolean(bundleSlugs.length))

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const hasBundles = bundles && containsBundles(bundles)
  const loadingOrHasBundles = loading || hasBundles

  const tableBundles = useMemo<TableBundle[]>(() => {
    const deletedTableBundles = Object.values(deletedBundles).map((deletedBundle) => ({
      ...deletedBundle,
      isDeleted: true,
    }))

    if (!bundles || !bundlesMetadata) return deletedTableBundles

    return [
      ...deletedTableBundles,
      ...bundles.map((bundle) => ({
        ...bundle,
        documentsMetadata: bundlesMetadata[bundle.slug] || {},
      })),
    ]
  }, [bundles, bundlesMetadata, deletedBundles])

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

  const currentArchivedPicker = useMemo(() => {
    const groupModeButtonBaseProps = {
      disabled: loading || !hasBundles,
      mode: 'bleed' as ButtonMode,
      padding: 2,
    }
    return (
      <Flex flex="none" gap={1}>
        <Button
          {...groupModeButtonBaseProps}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'open'}
          text="Open"
          value="open"
        />
        {/* StudioButton supports tooltip when button is disabled */}
        <StudioButton
          {...groupModeButtonBaseProps}
          disabled={groupModeButtonBaseProps.disabled || !groupedBundles.archived.length}
          tooltipProps={{
            disabled: groupedBundles.archived.length !== 0,
            content: 'No archived releases',
            placement: 'bottom',
          }}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'archived'}
          text="Archived"
          value="archived"
        />
      </Flex>
    )
  }, [
    bundleGroupMode,
    groupedBundles.archived.length,
    handleBundleGroupModeChange,
    hasBundles,
    loading,
  ])

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        disabled={isCreateBundleDialogOpen}
        onClick={() => setIsCreateBundleDialogOpen(true)}
        padding={2}
        space={2}
        text="Create release"
      />
    ),
    [isCreateBundleDialogOpen],
  )

  const renderCreateBundleDialog = () => {
    if (!isCreateBundleDialogOpen) return null

    return (
      <BundleDetailsDialog
        onCancel={() => setIsCreateBundleDialogOpen(false)}
        onSubmit={() => setIsCreateBundleDialogOpen(false)}
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

    return (
      <BundleMenuButton bundle={bundle} documentCount={bundle.documentsMetadata?.documentCount} />
    )
  }, [])

  return (
    <Flex paddingX={4} height="fill" direction="column" ref={scrollContainerRef} overflow={'auto'}>
      <Container width={2} paddingY={6}>
        <Flex align="flex-start" gap={2} paddingBottom={2}>
          <Flex align="flex-start" flex={1} gap={4}>
            <Stack paddingY={1} space={4}>
              <Heading as="h1" size={2} style={{margin: '1px 0'}}>
                Releases
              </Heading>
              {!loading && !hasBundles && (
                <Container style={{margin: 0}} width={0}>
                  <Stack space={5}>
                    <Text data-testid="no-bundles-info-text" muted size={2}>
                      Releases are collections of document versions which can be managed and
                      published together.
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
        {(hasBundles || loadingTableData) && (
          <Table<TableBundle>
            // for resetting filter and sort on table when mode changed
            key={bundleGroupMode}
            defaultSort={DEFAULT_RELEASES_OVERVIEW_SORT}
            loading={loadingTableData}
            data={groupedBundles[bundleGroupMode]}
            columnDefs={releasesOverviewColumnDefs}
            searchFilter={applySearchTermToBundles}
            emptyState="No Releases"
            rowId="_id"
            rowActions={renderRowActions}
            rowProps={getRowProps}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </Container>
      {renderCreateBundleDialog()}
    </Flex>
  )
}
