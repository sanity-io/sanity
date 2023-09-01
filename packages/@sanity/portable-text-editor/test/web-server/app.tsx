import {PortableTextBlock} from '@sanity/types'
import {Box, Card, Heading, Stack, studioTheme, ThemeProvider, Text, Inline} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {Subject} from 'rxjs'
import {EditorSelection, Patch} from '../../src'
import {Editor} from './components/Editor'
import {Value} from './components/Value'

export function App() {
  const patches$ = useMemo(
    () =>
      new Subject<{
        patches: Patch[]
        snapshot: PortableTextBlock[] | undefined
      }>(),
    [],
  )
  const [value, setValue] = useState<PortableTextBlock[] | undefined | null>(null)
  const [revId, setRevId] = useState<string | undefined>(undefined)
  const [selection, setSelection] = useState<EditorSelection | null>(null)
  const {editorId, testId} = useMemo(() => {
    const params = new URLSearchParams(document.location.search)
    return {
      editorId: params.get('editorId') || (Math.random() + 1).toString(36).substring(7),
      testId: params.get('testId') || 'noTestIdGiven',
    }
  }, [])
  const webSocket = useMemo(() => {
    const socket = new WebSocket(
      `ws://${window.location.hostname}:3001/?editorId=${editorId}&testId=${testId}`,
    )
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({type: 'hello', editorId, testId}))
    })
    socket.addEventListener('message', (message) => {
      if (message.data && typeof message.data === 'string') {
        const data = JSON.parse(message.data)
        if (data.testId === testId) {
          switch (data.type) {
            case 'value':
              setValue(data.value)
              setRevId(data.revId)
              break
            case 'selection':
              if (data.editorId === editorId && data.testId === testId) {
                setSelection(data.selection)
              }
              break
            case 'mutation':
              if (data.testId === testId) {
                patches$.next({
                  patches: data.patches,
                  snapshot: data.snapshot,
                })
              }
              break
            default:
            // Nothing
          }
        }
      }
    })
    return socket
  }, [editorId, patches$, testId])

  const handleMutation = useCallback(
    (patches: Patch[]) => {
      if (webSocket) {
        webSocket.send(JSON.stringify({type: 'mutation', patches, editorId, testId}))
      }
    },
    [editorId, testId, webSocket],
  )
  return (
    <ThemeProvider theme={studioTheme}>
      <Stack>
        <Card padding={[0, 3]} sizing="border">
          <Box>
            <Heading as="h2" size={3}>
              Test Document
            </Heading>
          </Box>
        </Card>
        <Card padding={[0, 3]} sizing="border">
          <Box marginBottom={2}>
            <Inline>
              <Text weight="bold">editorId:</Text> <Text>{editorId}</Text>
            </Inline>
          </Box>
          <Box>
            <Inline>
              <Text weight="bold">testId:</Text> <Text>{testId}</Text>
            </Inline>
          </Box>
        </Card>
        <Card padding={[0, 3]} sizing="border">
          <Box marginBottom={5}>
            <Box paddingBottom={4}>
              <Heading as="h3" size={1}>
                Editor
              </Heading>
            </Box>
            <Editor
              editorId={editorId}
              value={value || undefined}
              selection={selection}
              onMutation={handleMutation}
              patches$={patches$}
            />
          </Box>
        </Card>
        <Card padding={[0, 3]} sizing="border">
          <Value value={value || undefined} revId={revId || ''} />
        </Card>
      </Stack>
    </ThemeProvider>
  )
}
