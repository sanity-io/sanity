/* eslint-disable i18next/no-literal-string */
import {Box, Card, Code, Container, Heading, Stack, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {ErrorActions} from '../../components'
import {isDev, isProd} from '../../environment'

const View = styled(Box)`
  align-items: center;
`

export function FallbackErrorScreen(props: {
  error: Error
  eventId?: string
  heading?: string
  onReset: () => void
}) {
  const {error, eventId, heading = 'An error occurred', onReset} = props
  const message = error?.message
  const stack = typeof error?.stack === 'string' && error?.stack

  return (
    <Card height="fill" overflow="auto" paddingY={[4, 5, 6, 7]} paddingX={4} sizing="border">
      <View display="flex" height="fill">
        <Container width={3}>
          <Stack gap={6}>
            <Stack gap={4}>
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
                  <Stack gap={4}>
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
            </Stack>
            <ErrorActions error={error} eventId={eventId} onRetry={onReset} size="large" />
          </Stack>
        </Container>
      </View>
    </Card>
  )
}
