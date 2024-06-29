/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {AddIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Flex, Heading, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {LoadingBlock, useCurrentUser} from 'sanity'

import {useBundlesStore} from '../../store/bundles'
import {useBundleOperations} from '../../store/bundles/useBundleOperations'
import {CreateBundleDialog} from '../../versions/components/dialog/CreateBundleDialog'
import {type Bundle} from '../../versions/types'
import {getRandomToneIcon} from '../../versions/util/dummyGetters'
import {BundlesTable} from '../components/BundlesTable/BundlesTable'

type Mode = 'current' | 'past'

const HISTORY_MODES: {label: string; value: Mode}[] = [
  {label: 'Open', value: 'current'},
  {label: 'Archived', value: 'past'},
]

export default function BundlesOverview() {
  const {data, loading} = useBundlesStore()
  const {createBundle} = useBundleOperations()
  const currentUser = useCurrentUser()

  const [bundleHistoryMode, setBundleHistoryMode] = useState<Mode>('current')
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)

  const handleOnCreateBundle = useCallback(() => setIsCreateBundleDialogOpen(true), [])

  const hasBundles = data && Boolean(data.length)

  const renderCurrentArchivedPicker = useCallback(
    () => (
      <Card radius={2} shadow={1} tone="inherit">
        {HISTORY_MODES.map((mode) => (
          <Button
            // TODO: disable button if no bundle matching history
            disabled={loading || !hasBundles}
            key={mode.value}
            mode="bleed"
            onClick={() => setBundleHistoryMode(mode.value)}
            padding={2}
            selected={bundleHistoryMode === mode.value}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            text={mode.label}
          />
        ))}
      </Card>
    ),
    [bundleHistoryMode, hasBundles, loading],
  )

  const createReleaseButton = useMemo(
    () => (
      <Button
        icon={AddIcon}
        onClick={handleOnCreateBundle}
        padding={2}
        space={2}
        text="Create release"
      />
    ),
    [handleOnCreateBundle],
  )

  const renderBundleSearch = useCallback(
    () => (
      <Flex flex="none" gap={2}>
        <TextInput
          disabled={loading}
          fontSize={1}
          icon={SearchIcon}
          padding={2}
          placeholder="Search releases"
          space={2}
        />
        {createReleaseButton}
      </Flex>
    ),
    [createReleaseButton, loading],
  )

  const handleOnSubmitCreateBundle = useCallback(
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
        onSubmit={handleOnSubmitCreateBundle}
      />
    )
  }

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
                {loading && <LoadingBlock fill />}
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
              {renderCurrentArchivedPicker()}
            </Flex>
            {renderBundleSearch()}
          </Flex>
          {hasBundles && !loading && data && <BundlesTable bundles={data} />}
        </Stack>
      </Container>
      {renderCreateBundleDialog()}
    </Card>
  )
}
