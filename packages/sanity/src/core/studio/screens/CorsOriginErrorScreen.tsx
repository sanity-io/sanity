import {Card, Dialog, Stack, Button, Text, TextInput} from '@sanity/ui'
import React, {useEffect, useMemo} from 'react'

interface CorsOriginErrorScreenProps {
  projectId?: string
}

export function CorsOriginErrorScreen(props: CorsOriginErrorScreenProps) {
  const {projectId} = props

  const origin = window.location.origin
  const projectURL = `https://sanity.io/manage/project/${projectId}`
  const corsUrl = useMemo(() => {
    const url = new URL(`${projectURL}/api`)
    url.searchParams.set('cors', 'add')
    url.searchParams.set('origin', origin)
    url.searchParams.set('credentials', '')

    return url.toString()
  }, [origin, projectURL])

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
            your{' '}
            <a href={projectURL} target="_blank" rel="noreferrer">
              Sanity project
            </a>
            .
          </Text>

          <TextInput value={origin} readOnly />

          <Button
            as="a"
            href={corsUrl}
            target="_blank"
            rel="noopener noreferrer"
            text="Continue"
            tone="primary"
          />
        </Stack>
      </Dialog>
    </Card>
  )
}
