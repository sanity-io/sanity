/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {AddIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Flex, Heading, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {CreateBundleDialog} from '../../versions/components/dialog/CreateBundleDialog'
import {type Version} from '../../versions/types'
import {BUNDLES} from '../../versions/util/const'
import {BundlesTable} from '../components/BundlesTable/BundlesTable'

type Mode = 'current' | 'past'

const HISTORY_MODES: {label: string; value: Mode}[] = [
  {label: 'Open', value: 'current'},
  {label: 'Archived', value: 'past'},
]

export default function BundlesOverview() {
  const [bundles, setBundles] = useState<Version[]>(BUNDLES)
  const [bundleHistoryMode, setBundleHistoryMode] = useState<Mode>('current')
  const [isCreateBundleDialogOpen, setIsCreateBundleDialogOpen] = useState(false)

  const handleOnCreateBundle = useCallback(() => setIsCreateBundleDialogOpen(true), [])

  const hasBundles = Boolean(bundles.length)

  const renderCurrentArchivedPicker = useCallback(
    () => (
      <Card radius={2} shadow={1} tone="inherit">
        {HISTORY_MODES.map((mode) => (
          <Button
            // TODO: disable button if no bundle matching history
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
    [bundleHistoryMode],
  )

  const renderBundleSearch = useCallback(
    () => (
      <Flex flex="none" gap={2}>
        <TextInput
          fontSize={1}
          icon={SearchIcon}
          padding={2}
          placeholder="Search releases"
          space={2}
        />
        <Button
          icon={AddIcon}
          onClick={handleOnCreateBundle}
          padding={2}
          space={2}
          text="Create release"
        />
      </Flex>
    ),
    [handleOnCreateBundle],
  )

  const renderCreateBundleDialog = () => {
    if (!isCreateBundleDialogOpen) return null

    return (
      <CreateBundleDialog
        onCancel={() => setIsCreateBundleDialogOpen(false)}
        onSubmit={() => null}
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

                {!hasBundles && (
                  <Container style={{margin: 0}} width={0}>
                    <Stack space={5}>
                      <Text muted size={2}>
                        Releases are collections of document versions which can be managed and
                        published together.
                      </Text>
                      <Box>
                        <Button
                          icon={AddIcon}
                          onClick={handleOnCreateBundle}
                          padding={2}
                          space={2}
                          text="Create release"
                        />
                      </Box>
                    </Stack>
                  </Container>
                )}
              </Stack>
              {hasBundles && renderCurrentArchivedPicker()}
            </Flex>
            {hasBundles && renderBundleSearch()}
          </Flex>
          {hasBundles && <BundlesTable bundles={bundles} />}
        </Stack>
      </Container>
      {renderCreateBundleDialog()}
    </Card>
  )
}
