/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {AddIcon, SearchIcon} from '@sanity/icons'
import {
  Box,
  Button,
  type ButtonMode,
  Card,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {isBefore} from 'date-fns'
import {type MouseEventHandler, useCallback, useMemo, useState} from 'react'
import {LoadingBlock, useCurrentUser} from 'sanity'

import {Button as StudioButton} from '../../../ui-components'
import {useBundlesStore} from '../../store/bundles'
import {type BundleDocument} from '../../store/bundles/types'
import {useBundleOperations} from '../../store/bundles/useBundleOperations'
import {CreateBundleDialog} from '../../versions/components/dialog/CreateBundleDialog'
import {type Bundle} from '../../versions/types'
import {getRandomToneIcon} from '../../versions/util/dummyGetters'
import {BundlesTable} from '../components/BundlesTable/BundlesTable'
import {containsBundles} from '../types/bundle'

type Mode = 'open' | 'archived'

const EMPTY_BUNDLE_GROUPS = {open: [], archived: []}

export default function BundlesOverview() {
  const {data, loading} = useBundlesStore()
  const {createBundle} = useBundleOperations()
  const currentUser = useCurrentUser()

  const [bundleGroupMode, setBundleGroupMode] = useState<Mode>('open')
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>()

  const hasBundles = data && containsBundles(data)
  const loadingOrHasBundles = loading || hasBundles

  const groupedBundles = useMemo(
    () =>
      data?.reduce<{open: BundleDocument[]; archived: BundleDocument[]}>((groups, bundle) => {
        const group =
          bundle.publishedAt && isBefore(bundle.publishedAt, new Date()) ? 'archived' : 'open'

        return {...groups, [group]: [...groups[group], bundle]}
      }, EMPTY_BUNDLE_GROUPS) || EMPTY_BUNDLE_GROUPS,
    [data],
  )

  const handleBundleGroupModeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    ({currentTarget: {value: groupMode}}) => setBundleGroupMode(groupMode as Mode),
    [],
  )

  const currentArchivedPicker = useMemo(() => {
    const groupModeButtonBaseProps = {
      disabled: loading || !hasBundles,
      mode: 'bleed' as ButtonMode,
      padding: 2,
      style: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },
    }
    return (
      <Card radius={2} shadow={1} tone="inherit" display="flex">
        <Button
          {...groupModeButtonBaseProps}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'open'}
          text="Open"
        />
        {/* StudioButton supports tooltip when button is disabled */}
        <StudioButton
          {...groupModeButtonBaseProps}
          disabled={groupModeButtonBaseProps.disabled || !groupedBundles.archived.length}
          tooltipProps={{
            disabled: groupedBundles.archived.length !== 0,
            content: 'No published releases',
            placement: 'bottom',
          }}
          onClick={handleBundleGroupModeChange}
          selected={bundleGroupMode === 'archived'}
          text="Archived"
        />
      </Card>
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
        onClick={() => setIsCreateBundleDialogOpen(true)}
        padding={2}
        space={2}
        text="Create release"
      />
    ),
    [],
  )

  const bundleSearch = useMemo(
    () => (
      <Flex flex="none" gap={2}>
        <TextInput
          disabled={loading}
          fontSize={1}
          icon={SearchIcon}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          onClear={() => setSearchTerm('')}
          padding={2}
          clearButton={!!searchTerm}
          placeholder="Search releases"
          space={2}
        />
        {createReleaseButton}
      </Flex>
    ),
    [createReleaseButton, loading, searchTerm],
  )

  const handleOnCreateBundle = useCallback(
    (bundleFormValue: Bundle) => {
      createBundle({
        _type: 'bundle',
        name: bundleFormValue.title,
        authorId: currentUser?.id,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        title: bundleFormValue.title,
        description: bundleFormValue.description,
        ...getRandomToneIcon(),
      })
    },
    [createBundle, currentUser],
  )

  const renderCreateBundleDialog = () => {
    if (!isCreateBundleDialogOpen) return null

    return (
      <CreateBundleDialog
        onCancel={() => setIsCreateBundleDialogOpen(false)}
        onSubmit={handleOnCreateBundle}
      />
    )
  }

  const applySearchTermToBundles = useCallback(
    (bundle: BundleDocument) => !searchTerm || bundle.title.includes(searchTerm),
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
            {loadingOrHasBundles && bundleSearch}
          </Flex>
          {loading ? (
            <LoadingBlock fill data-testid="bundle-table-loader" />
          ) : (
            <BundlesTable bundles={filteredBundles} />
          )}
        </Stack>
      </Container>
      {renderCreateBundleDialog()}
    </Card>
  )
}
