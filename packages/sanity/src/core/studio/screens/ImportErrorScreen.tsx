/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {SyncIcon} from '@sanity/icons'
import {Box, Card, Code, Container, Heading, Inline, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of, take, timer} from 'rxjs'
import {map} from 'rxjs/operators'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components'
import {isDev} from '../../environment'

const View = styled(Box)`
  align-items: center;
`

function reloadPage() {
  window.location.reload()
}
const COUNTDOWN_SECONDS = 5
export function ImportErrorScreen(props: {error: Error; eventId?: string; autoReload?: boolean}) {
  const {error, eventId, autoReload} = props

  const countdownSeconds = useObservable(
    useMemo(
      () =>
        autoReload
          ? timer(0, 1_000).pipe(
              take(COUNTDOWN_SECONDS + 1),
              map((seconds) => COUNTDOWN_SECONDS - seconds),
            )
          : of(0),
      [autoReload],
    ),
    COUNTDOWN_SECONDS,
  )

  useEffect(() => {
    if (autoReload && countdownSeconds < 1) reloadPage()
  }, [autoReload, countdownSeconds])

  return (
    <Card height="fill" overflow="auto" paddingY={[4, 5, 6, 7]} paddingX={4} sizing="border">
      <View display="flex" height="fill">
        <Container width={3}>
          <Stack gap={6}>
            <Stack gap={4}>
              <Heading>Import error</Heading>
              <Text>An error occurred during dynamic import.</Text>
              {isDev && (
                <Card border radius={2} overflow="auto" padding={4} tone="critical">
                  <Stack gap={4}>
                    {error.message && (
                      <Code weight={'bold'} size={1}>
                        {error.message}
                      </Code>
                    )}
                    {error.stack && <Code size={1}>{error.stack}</Code>}
                    {eventId && <Code size={1}>Event ID: {eventId}</Code>}
                  </Stack>
                </Card>
              )}
              {autoReload ? (
                <Text muted>
                  Reloading {countdownSeconds <= 0 ? 'now' : `in ${countdownSeconds}s`}…
                </Text>
              ) : null}
              <Inline gap={3}>
                <Button
                  onClick={reloadPage}
                  text={autoReload ? 'Reload now' : 'Reload'}
                  tone="primary"
                  icon={SyncIcon}
                  size="large"
                />
              </Inline>
            </Stack>
          </Stack>
        </Container>
      </View>
    </Card>
  )
}
