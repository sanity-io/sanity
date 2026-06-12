/* eslint-disable i18next/no-literal-string */
import {Box, Card, Code, Container, Heading, Stack, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {ErrorActions} from '../../components'
import {isDev, isProd} from '../../environment'
import {isClientRequestError} from '../requestErrors/classify'

const View = styled(Box)`
  align-items: center;
`

const TIP_SNIPPET = `const {attempt, handle} = useStudioErrorHandler()

// retryable read — the dialog offers "Try again"
const data = await attempt(() => client.fetch(query), {retryable: true})

// or fire-and-surface in a .catch
client.create(doc).catch(handle)`

export function FallbackErrorScreen(props: {
  error: Error
  eventId?: string
  heading?: string
  onReset: () => void
}) {
  const {error, eventId, heading = 'An error occurred', onReset} = props
  const message = error?.message
  const stack = typeof error?.stack === 'string' && error?.stack

  // Dev-only nudge: an uncaught request error reached the boundary, which
  // means it wasn't handled locally or delegated to the studio. Point the
  // author at the opt-in so transient failures stop crashing the studio.
  const showRequestErrorTip = isDev && isClientRequestError(error)

  return (
    <Card
      data-testid="studio-error-screen"
      data-error={message || heading}
      height="fill"
      overflow="auto"
      paddingY={[4, 5, 6, 7]}
      paddingX={4}
      sizing="border"
    >
      <View display="flex" height="fill">
        <Container width={3}>
          <Stack space={6}>
            <Stack space={4}>
              <Heading>{heading}</Heading>
              <Text>An error occurred that Sanity Studio was unable to recover from.</Text>
              {isProd && (
                <Text>
                  <strong>To report this error,</strong> copy the error details and share them with
                  your development team or Sanity Support.
                </Text>
              )}
              {isDev && (
                <Card border radius={2} overflow="auto" padding={4} tone="critical">
                  <Stack space={4}>
                    {message && (
                      <Code weight={'bold'} size={1}>
                        {message}
                      </Code>
                    )}
                    {stack && <Code size={1}>{stack}</Code>}
                    {eventId && <Code size={1}>Event ID: {eventId}</Code>}
                  </Stack>
                </Card>
              )}
              {showRequestErrorTip && (
                <Card border radius={2} padding={4} tone="caution">
                  <Stack space={3}>
                    <Text size={1} weight="medium">
                      Developer tip
                    </Text>
                    <Text size={1} muted>
                      Request errors that the Studio can recover from (network failures, 5xx, 429,
                      session expiry) shouldn&apos;t reach this screen. Handle the error where you
                      issue the request, or delegate it to the Studio&apos;s built-in error UI:
                    </Text>
                    <Card border radius={1} overflow="auto" padding={3} tone="transparent">
                      <Code size={1}>{TIP_SNIPPET}</Code>
                    </Card>
                    <Text size={1} muted>
                      This tip is only shown in development.
                    </Text>
                  </Stack>
                </Card>
              )}
            </Stack>
            <ErrorActions error={error} eventId={eventId} onRetry={onReset} size="large" />
          </Stack>
        </Container>
      </View>
    </Card>
  )
}
