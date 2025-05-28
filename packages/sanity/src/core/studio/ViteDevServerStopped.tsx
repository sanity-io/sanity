/* eslint-disable i18next/no-literal-string -- will not support i18n in error boundaries */
import {Card, Container, Heading, Stack, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {type ViteHotContext} from 'vite/types/hot.js'

const ERROR_TITLE = 'Dev server stopped'
const ERROR_DESCRIPTION =
  'The development server has stopped. You may need to restart it to continue working.'

export class ViteDevServerStoppedError extends Error {
  ViteDevServerStoppedError: boolean

  constructor() {
    super(ERROR_TITLE)
    this.name = 'ViteDevServerStoppedError'
    this.ViteDevServerStoppedError = true
  }
}
const serverHot = import.meta.hot
const isViteServer = (hot: unknown): hot is ViteHotContext => Boolean(hot)

const useDetectViteDevServerStopped = () => {
  const [devServerStopped, setDevServerStopped] = useState(false)

  const markDevServerStopped = useCallback(() => setDevServerStopped(true), [])

  useEffect(() => {
    // no early return to optimize tree-shaking
    if (isViteServer(serverHot)) {
      serverHot.on('vite:ws:disconnect', markDevServerStopped)
    }
  }, [markDevServerStopped])

  return {devServerStopped}
}

const ThrowViteServerStopped = () => {
  const {devServerStopped} = useDetectViteDevServerStopped()

  if (devServerStopped) throw new ViteDevServerStoppedError()

  return null
}

export const DetectViteDevServerStopped = (): ReactNode =>
  isViteServer(serverHot) ? <ThrowViteServerStopped /> : null

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
