import {Box, Card, Stack, studioTheme, ThemeProvider} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

import ReactDOM from 'react-dom'
import {Subject} from 'rxjs'
import {EditorSelection, Patch, PortableTextBlock} from '../../src'
import {Editor} from './components/Editor'
import {Value} from './components/Value'

ReactDOM.render(<App />, document.getElementById('root'))

export function App() {
  const incomingPatches$ = useMemo(() => new Subject<Patch>(), [])
  const [value, setValue] = useState<PortableTextBlock[] | undefined>(undefined)
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
    const socket = new WebSocket(`ws://localhost:3001/?editorId=${editorId}&testId=${testId}`)
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
              if (data.editorId !== editorId && data.testId === testId) {
                data.patches.map((patch) => incomingPatches$.next(patch))
              }
              break
            default:
            // Nothing
          }
        }
      }
    })
    return socket
  }, [editorId, incomingPatches$, testId])

  const handleMutation = useCallback(
    (patches: Patch[]) => {
      if (webSocket) {
        webSocket.send(JSON.stringify({type: 'mutation', patches, editorId, testId}))
      }
    },
    [editorId, testId, webSocket]
  )

  return (
    <ThemeProvider theme={studioTheme}>
      <Stack>
        <Card padding={[3, 4, 5, 6]} sizing="border">
          <Box marginBottom={5}>
            <Editor
              editorId={editorId}
              value={value}
              selection={selection}
              onMutation={handleMutation}
              incomingPatches$={incomingPatches$}
            />
          </Box>
        </Card>
      </Stack>
      <Stack>
        <Card padding={[3, 4, 5, 6]} sizing="border">
          <Value value={value} revId={revId} />
        </Card>
      </Stack>
    </ThemeProvider>
  )
}
