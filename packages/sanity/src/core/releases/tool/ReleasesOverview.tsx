/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {AddIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Flex, Heading, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {getRandomToneIcon, type Version} from '../../util/versions/util'
import {ReleaseTable} from '../components/releaseTable/ReleaseTable'

type Mode = 'current' | 'past'

const HISTORY_MODES: {label: string; value: Mode}[] = [
  {label: 'Open', value: 'current'},
  {label: 'Archived', value: 'past'},
]

export default function ReleasesOverview() {
  const [releases, setReleases] = useState<Version[]>([])
  const [releaseHistoryMode, setReleaseHistoryMode] = useState<Mode>('current')

  const handleCreateReleaseClick = useCallback(() => {
    const {hue, icon} = getRandomToneIcon()

    setReleases((currentReleases) => {
      const name = `New release ${currentReleases.length + 1}`

      return [
        ...currentReleases,
        {
          name,
          title: name,
          hue,
          icon,
          publishAt: Date.now() + 1000 * 60 * 60 * 24 * 2,
        },
      ]
    })
  }, [])

  const hasReleases = Boolean(releases.length)

  const renderCurrentArchivedPicker = useCallback(
    () => (
      <Card radius={2} shadow={1} tone="inherit">
        {HISTORY_MODES.map((mode) => (
          <Button
            // TODO: disable button if no releases matching history
            key={mode.value}
            mode="bleed"
            onClick={() => setReleaseHistoryMode(mode.value)}
            padding={2}
            selected={releaseHistoryMode === mode.value}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            text={mode.label}
          />
        ))}
      </Card>
    ),
    [releaseHistoryMode],
  )

  const renderReleaseSearch = useCallback(
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
          onClick={handleCreateReleaseClick}
          padding={2}
          space={2}
          text="Create release"
        />
      </Flex>
    ),
    [handleCreateReleaseClick],
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

                {!hasReleases && (
                  <Container style={{margin: 0}} width={0}>
                    <Stack space={5}>
                      <Text muted size={2}>
                        Releases are collections of document versions which can be managed and
                        published together.
                      </Text>
                      <Box>
                        <Button
                          icon={AddIcon}
                          onClick={handleCreateReleaseClick}
                          padding={2}
                          space={2}
                          text="Create release"
                        />
                      </Box>
                    </Stack>
                  </Container>
                )}
              </Stack>
              {hasReleases && renderCurrentArchivedPicker()}
            </Flex>
            {hasReleases && renderReleaseSearch()}
          </Flex>
          {hasReleases && <ReleaseTable releases={releases} />}
        </Stack>
      </Container>
    </Card>
  )
}
