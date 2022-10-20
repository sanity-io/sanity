import {Card, Dialog, Stack, Button, Text, TextInput} from '@sanity/ui'
import React, {useEffect, useMemo} from 'react'

interface CorsOriginErrorScreenProps {
  projectId?: string
}

export function CorsOriginErrorScreen(props: CorsOriginErrorScreenProps) {
  const {projectId} = props

  const origin = window.location.origin
  const corsUrl = useMemo(() => {
    // const url = new URL(`http://localhost:3000/manage/project/${projectId}/api`)
    const url = new URL(
      `https://manage-git-feat-sc-25721cors.sanity.build/manage/project/${projectId}/api`
    )
    // const url = new URL(`https://sanity.io/manage/project/${projectId}/api`)
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
            To access your content, you need to{' '}
            <b>add the following URLas an allowed CORS origin</b> to your Sanity project.
          </Text>

          <TextInput value={origin} readOnly />

          <Button
            as="a"
            href={corsUrl}
            target="_blank"
            rel="noopener noreferrer"
            text="Add CORS origin"
            tone="primary"
          />
        </Stack>
      </Dialog>
    </Card>
  )
}
