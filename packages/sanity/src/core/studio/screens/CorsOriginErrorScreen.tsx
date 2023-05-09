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
  overflow: clip;
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
            To access your content, you need to <b>add the following URL as a CORS origin</b> to
            your Sanity project.
          </Text>

          {/* added for accessibility */}
          <ScreenReaderLabel aria-hidden="true">CORS URL to be added</ScreenReaderLabel>
          <TextInput value={origin} readOnly />

          <Button as="a" href={corsUrl} target="_blank" rel="noopener noreferrer" tone="primary">
            <Flex align="center" justify="center" gap={3}>
              <Text weight="medium">Continue</Text>
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
