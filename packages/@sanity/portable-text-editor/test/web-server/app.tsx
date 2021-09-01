import {Box, Card, Stack, studioTheme, ThemeProvider} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

import ReactDOM from 'react-dom'
import {Subject} from 'rxjs'
import {Patch, PortableTextBlock} from '../../src'
import {Editor} from './components/Editor'
import {Value} from './components/Value'

ReactDOM.render(<App />, document.getElementById('root'))

export function App() {
  const incomingPatches$ = useMemo(() => new Subject<Patch>(), [])
  const [value, setValue] = useState<PortableTextBlock[] | undefined>(undefined)
  const {editorId, testSuiteId} = useMemo(() => {
    const params = new URLSearchParams(document.location.search)
    return {
      editorId: params.get('editorId') || (Math.random() + 1).toString(36).substring(7),
      testSuiteId: params.get('testSuiteId') || (Math.random() + 1).toString(36).substring(7),
    }
  }, [])
  const webSocket = useMemo(() => {
    const socket = new WebSocket(
      `ws://localhost:3001/?editorId=${testSuiteId}&testSuiteId=${testSuiteId}`
    )
    socket.addEventListener('message', (message) => {
      if (message.data && typeof message.data === 'string') {
        const data = JSON.parse(message.data)
        if (data.testSuiteId === testSuiteId) {
          if (data.type === 'value') {
            setValue(data.value)
          }
          if (data.type === 'mutation' && data.editorId !== editorId) {
            data.patches.map((patch) => incomingPatches$.next(patch))
          }
        }
      }
    })
    return socket
  }, [editorId, incomingPatches$, testSuiteId])
  const handleMutation = useCallback(
    (patches: Patch[]) => {
      if (webSocket) {
        webSocket.send(JSON.stringify({type: 'mutation', patches, editorId, testSuiteId}))
      }
    },
    [editorId, testSuiteId, webSocket]
  )
  return (
    <ThemeProvider theme={studioTheme}>
      <Stack>
        <Card padding={[3, 4, 5, 6]} sizing="border">
          <Box marginBottom={5}>
            <Editor
              editorId={editorId}
              value={value}
              onMutation={handleMutation}
              incomingPatches$={incomingPatches$}
            />
          </Box>
        </Card>
      </Stack>
      <Stack>
        <Card padding={[3, 4, 5, 6]} sizing="border">
          <Value value={value} />
        </Card>
      </Stack>
    </ThemeProvider>
  )
}
