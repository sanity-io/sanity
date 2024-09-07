/* eslint-disable i18next/no-literal-string */
import {Card, Code, Container, Heading, Stack, useToast} from '@sanity/ui'
import {useEffect, useRef, useState} from 'react'

// eslint-disable-next-line no-console
console.log('LOADED DEV SERVER STATUS')

class DevServerStopError extends Error {
  isDevServerError: boolean

  constructor() {
    super('Dev server stopped')
    this.name = 'DevServerStopError'
    this.isDevServerError = true
  }
}

const useDetectDevServerDisconnect = () => {
  const [devServerStopped, setDevServerStopped] = useState(false)
  const serverIsReadyRef = useRef(false)

  useEffect(() => {
    const url = `ws://${window.location.hostname}:${window.location.port}/`
    const ws = new WebSocket(url, 'vite-hmr')

    ws.onclose = () => {
      if (!serverIsReadyRef.current) return
      setDevServerStopped(true)
    }
    ws.onopen = () => {
      if (!serverIsReadyRef.current) {
        serverIsReadyRef.current = true
      }

      setDevServerStopped(false)
    }

    return () => ws.close()
  }, [])

  return {devServerStopped}
}

export const DevServerStatusToast = () => {
  const {devServerStopped} = useDetectDevServerDisconnect()
  const toast = useToast()

  useEffect(() => {
    if (devServerStopped) {
      toast.push({
        id: 'dev-server-stopped',
        duration: 60000,
        closable: true,
        status: 'error',
        title: 'Dev server stopped',
        description:
          'The development server has stopped. You may need to restart it to continue working.',
      })
    }
  }, [devServerStopped, toast])

  return null
}

export const DevServerStatusThrower = () => {
  const {devServerStopped} = useDetectDevServerDisconnect()

  if (devServerStopped) throw new DevServerStopError()
}

export const DevServerErrorScreen = () => (
  <Card
    height="fill"
    overflow="auto"
    paddingY={[4, 5, 6, 7]}
    paddingX={4}
    sizing="border"
    tone="critical"
  >
    <Container width={3}>
      <Stack space={4}>
        <Heading>The Dev server was stopped</Heading>

        <Card border radius={2} overflow="auto" padding={4} tone="inherit">
          <Stack space={4}>
            <Code size={1}>
              <strong>
                The development server has stopped. You may need to restart it to continue working.
              </strong>
            </Code>
          </Stack>
        </Card>
      </Stack>
    </Container>
  </Card>
)
