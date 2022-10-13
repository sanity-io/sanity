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
      <Dialog
        id="cors-error-dialog"
        header="Configure API access"
        width={1}
        footer={
          <Stack paddingX={3} paddingY={2}>
            <Button
              as="a"
              href={corsUrl}
              target="_blank"
              rel="noopener noreferrer"
              text="Add origin"
              tone="primary"
            />
          </Stack>
        }
      >
        <Stack paddingX={4} paddingY={5} space={4}>
          <Text>
            It looks like you're trying to connect to the Content Lake API from this origin:
          </Text>

          <TextInput value={origin} readOnly />

          <Text>
            However it's not in the{' '}
            <a
              href="https://www.sanity.io/docs/front-ends/cors"
              target="_blank"
              rel="noopener noreferrer"
            >
              list over allowed CORS origins
            </a>{' '}
            for{' '}
            <a
              href={`https://sanity.io/manage/project/${projectId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              your project.
            </a>
          </Text>

          <Text>Add it now to proceed loading your studio.</Text>
        </Stack>
      </Dialog>
    </Card>
  )
}
