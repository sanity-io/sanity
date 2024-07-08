import {AddIcon} from '@sanity/icons'
import {Box, Button, type ButtonMode, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'
import {isBefore} from 'date-fns'
import {type MouseEventHandler, useCallback, useEffect, useMemo, useState} from 'react'

import {Button as StudioButton} from '../../../ui-components'
import {CreateBundleDialog} from '../../bundles/components/dialog/CreateBundleDialog'
import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {useBundles} from '../../store/bundles/BundlesProvider'
import {type BundleDocument} from '../../store/bundles/types'
import {BundlesTable} from '../components/BundlesTable/BundlesTable'
import {containsBundles} from '../types/bundle'

type Mode = 'open' | 'archived'

const EMPTY_BUNDLE_GROUPS = {open: [], archived: []}

export default function BundlesOverview() {
  const {data, loading} = useBundles()

  const [bundleGroupMode, setBundleGroupMode] = useState<Mode>('open')
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>()

  const hasBundles = data && containsBundles(data)
  const loadingOrHasBundles = loading || hasBundles

  const groupedBundles = useMemo(
    () =>
      data?.reduce<{open: BundleDocument[]; archived: BundleDocument[]}>((groups, bundle) => {
        const isBundleArchived =
          bundle.archivedAt ||
          (bundle.publishedAt && isBefore(new Date(bundle.publishedAt), new Date()))
        const group = isBundleArchived ? 'archived' : 'open'

        return {...groups, [group]: [...groups[group], bundle]}
      }, EMPTY_BUNDLE_GROUPS) || EMPTY_BUNDLE_GROUPS,
    [data],
  )

  // switch to open mode if on archived mode and there are no archived bundles
  useEffect(() => {
    if (bundleGroupMode === 'archived' && !groupedBundles.archived.length) {
      setBundleGroupMode('open')
    }
  }, [bundleGroupMode, groupedBundles.archived.length])

  // clear search when mode changes
  useEffect(() => setSearchTerm(''), [bundleGroupMode])

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
      <CreateBundleDialog
        onCancel={() => setIsCreateBundleDialogOpen(false)}
        onCreate={() => setIsCreateBundleDialogOpen(false)}
      />
    )
  }

  const applySearchTermToBundles = useCallback(
    (bundle: BundleDocument) =>
      !searchTerm || bundle.title.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()),
    [searchTerm],
  )

  const filteredBundles = useMemo(
    () => groupedBundles[bundleGroupMode]?.filter(applySearchTermToBundles) || [],
    [applySearchTermToBundles, bundleGroupMode, groupedBundles],
  )

  return (
    <Card flex={1} overflow="auto">
      <Container width={3}>
        <Stack paddingX={4} paddingY={6} space={4}>
          <Flex align="flex-start" gap={2} paddingBottom={2}>
            <Flex align="flex-start" flex={1} gap={4}>
              <Stack paddingY={1} space={4}>
                <Heading as="h1" size={2} style={{margin: '1px 0'}}>
                  Releases
                </Heading>
                {!loading && !hasBundles && (
                  <Container style={{margin: 0}} width={0}>
                    <Stack space={5}>
                      <Text muted size={2}>
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
          {loading ? (
            <LoadingBlock fill data-testid="bundle-table-loader" />
          ) : (
            <BundlesTable
              bundles={filteredBundles}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}
        </Stack>
      </Container>
      {renderCreateBundleDialog()}
    </Card>
  )
}
