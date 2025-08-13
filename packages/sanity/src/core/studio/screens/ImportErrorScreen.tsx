/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {SyncIcon} from '@sanity/icons'
import {Box, Card, Code, Container, Heading, Inline, Stack, Text} from '@sanity/ui'
import {useEffect, useReducer, useState} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components/button/Button'
import {isDev} from '../../environment'

const View = styled(Box)`
  align-items: center;
`

function reloadPage() {
  window.location.reload()
}
export function ImportErrorScreen(props: {error: Error; eventId?: string; autoReload?: boolean}) {
  const {error, eventId, autoReload} = props

  const [reloadAt] = useState<number>(() => Date.now() + 5_000)

  const [, tick] = useReducer((state) => state + 1, 0)

  const countdownSeconds = Math.floor((reloadAt - Date.now()) / 1000)

  useEffect(() => {
    if (!autoReload) {
      return () => {}
    }
    const interval = setInterval(() => tick(), 500)
    return () => clearInterval(interval)
  }, [autoReload])

  useEffect(() => {
    if (countdownSeconds <= 0) reloadPage()
  }, [autoReload, countdownSeconds])

  return (
    <Card height="fill" overflow="auto" paddingY={[4, 5, 6, 7]} paddingX={4} sizing="border">
      <View display="flex" height="fill">
        <Container width={3}>
          <Stack space={6}>
            <Stack space={4}>
              <Heading>Import error</Heading>
              <Text>An error occurred during dynamic import.</Text>
              {isDev && (
                <Card border radius={2} overflow="auto" padding={4} tone="critical">
                  <Stack space={4}>
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
                  Reloading {countdownSeconds <= 0 ? 'now' : `in ${countdownSeconds.toFixed()}s`}…
                </Text>
              ) : null}
              <Inline space={3}>
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
