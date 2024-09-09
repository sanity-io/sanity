/* eslint-disable i18next/no-literal-string -- will not support i18n in error boundaries */
import {Card, Container, Heading, Stack, Text} from '@sanity/ui'
import {type ReactNode, useEffect, useRef, useState} from 'react'

const ERROR_TITLE = 'Dev server stopped'
const ERROR_DESCRIPTION =
  'The development server has stopped. You may need to restart it to continue working.'

class DevServerStoppedError extends Error {
  isDevServerStoppedError: boolean

  constructor() {
    super(ERROR_TITLE)
    this.name = 'DevServerStoppedError'
    this.isDevServerStoppedError = true
  }
}

const useDetectDevServerStopped = () => {
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

export const DetectDevServerStopped = (): null => {
  const {devServerStopped} = useDetectDevServerStopped()

  if (devServerStopped) throw new DevServerStoppedError()

  return null
}

export const DevServerStoppedErrorScreen = (): ReactNode => (
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
        <Heading>{ERROR_TITLE}</Heading>

        <Card border radius={2} overflow="auto" padding={4} tone="inherit">
          <Stack space={4}>
            <Text size={2}>{ERROR_DESCRIPTION}</Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  </Card>
)
