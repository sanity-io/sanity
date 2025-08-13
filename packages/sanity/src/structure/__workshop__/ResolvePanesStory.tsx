import {Box, Card, Code, Flex, Radio, Stack, Text} from '@sanity/ui'
import {type ChangeEvent, useCallback, useState} from 'react'

import {LOADING_PANE} from '../constants'
import {useResolvedPanes} from '../structureResolvers/useResolvedPanes'
import {StructureToolProvider} from '../StructureToolProvider'
import {type RouterPanes} from '../types'

const testPaths: RouterPanes[] = [
  [],

  // Opened the `Author` document type list
  [[{id: 'author'}]],

  // Opened the `Author` document type list
  // Opened the `foo` document editor
  [[{id: 'author'}], [{id: 'foo'}]],
]

export default function ResolvePanesStoryWrapper() {
  return (
    <StructureToolProvider structure={useCallback((S: any) => S.list().title('Content'), [])}>
      <ResolvePanesStory />
    </StructureToolProvider>
  )
}

function ResolvePanesStory() {
  const {paneDataItems, resolvedPanes, routerPanes} = useResolvedPanes()
  const [testKey, setTestKey] = useState('0')

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value

    setTestKey(inputValue)
  }, [])

  return (
    <Box padding={4}>
      <Stack marginBottom={5} space={3}>
        {testPaths.map((testPath, idx) => (
          <Flex key={idx} align="center" as="label">
            <Radio
              checked={String(idx) === testKey}
              name="path"
              onChange={handleChange}
              value={String(idx)}
            />
            <Box flex={1} marginLeft={3}>
              <Text>
                <code>{JSON.stringify(testPath)}</code>
              </Text>
            </Box>
          </Flex>
        ))}
      </Stack>

      <Code language="json" size={1}>
        {JSON.stringify(routerPanes)}
      </Code>

      <Stack marginTop={5} space={1}>
        {resolvedPanes.map((resolvedPane, idx) => {
          const paneData = paneDataItems[idx]

          if (resolvedPane === LOADING_PANE) {
            return (
              <Card key={idx} border padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Text>[Loading…]</Text>
              </Card>
            )
          }

          if (resolvedPane.type === 'list') {
            return (
              <Card key={idx} border padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Stack space={3}>
                  <Text>[List] {resolvedPane.title}</Text>
                  <Text size={1}>
                    <code>{paneData.path}</code>
                  </Text>
                  <Code language="json" size={1}>{`${JSON.stringify(
                    resolvedPane.items?.length,
                  )} items`}</Code>
                </Stack>
              </Card>
            )
          }

          if (resolvedPane.type === 'documentList') {
            return (
              <Card key={idx} border padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Stack space={3}>
                  <Text>[DocumentList] {resolvedPane.title}</Text>
                  <Text size={1}>
                    <code>{paneData.path}</code>
                  </Text>
                  <Code language="json" size={1}>
                    {JSON.stringify(resolvedPane.options, null, 2)}
                  </Code>
                </Stack>
              </Card>
            )
          }

          if (resolvedPane.type === 'document') {
            return (
              <Card key={idx} border padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Stack space={3}>
                  <Text>[Document]</Text>
                  <Text size={1}>
                    <code>{paneData.path}</code>
                  </Text>
                  <Code language="json" size={1}>
                    {JSON.stringify(resolvedPane.options, null, 2)}
                  </Code>
                </Stack>
              </Card>
            )
          }

          return (
            <Card key={idx} border padding={4} tone={paneData.active ? 'primary' : undefined}>
              <Text>
                [{resolvedPane.type}] {resolvedPane.title}
              </Text>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
