import i18n from 'i18next'
import k from './../../../i18n/keys'
import {Card, Dialog, Stack, Button, Text, TextInput, Flex} from '@sanity/ui'
import React, {useEffect, useMemo} from 'react'
import {LaunchIcon} from '@sanity/icons'
import styled from 'styled-components'

interface CorsOriginErrorScreenProps {
  projectId?: string
}

export const ScreenReaderLabel = styled.label`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`

export function CorsOriginErrorScreen(props: CorsOriginErrorScreenProps) {
  const {projectId} = props

  const origin = window.location.origin
  const corsUrl = useMemo(() => {
    const url = new URL(`https://sanity.io/manage/project/${projectId}/api`)
    url.searchParams.set('cors', 'add')
    url.searchParams.set('origin', origin)
    url.searchParams.set('credentials', '')

    return url.toString()
  }, [origin, projectId])

  useEffect(() => {
    const handleFocus = () => {
      window.location.reload()
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <Card height="fill">
      <Dialog id="cors-error-dialog" header="Before you continue..." width={1}>
        <Stack paddingX={4} paddingY={5} space={4}>
          <Text>
            {i18n.t(k.TO_ACCESS_YOUR_CONTENT_YOU_NE)}{' '}
            <b>{i18n.t(k.ADD_THE_FOLLOWING_URL_AS_A_COR)}</b> {i18n.t(k.TO_YOUR_SANITY_PRO)}
          </Text>

          {/* added for accessibility */}
          <ScreenReaderLabel aria-hidden="true">{i18n.t(k.CORS_URL_TO_BE_ADDED)}</ScreenReaderLabel>
          <TextInput value={origin} readOnly />

          <Button as="a" href={corsUrl} target="_blank" rel="noopener noreferrer" tone="primary">
            <Flex align="center" justify="center" gap={3}>
              <Text weight="medium">{i18n.t(k.CONTINUE)}</Text>
              <Text weight="medium">
                <LaunchIcon />
              </Text>
            </Flex>
          </Button>
        </Stack>
      </Dialog>
    </Card>
  )
}
