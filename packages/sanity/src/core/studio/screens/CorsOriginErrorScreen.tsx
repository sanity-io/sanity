import {Card, Dialog, Stack, Button, Text} from '@sanity/ui'
import React, {useCallback} from 'react'

interface CorsOriginErrorScreenProps {
  projectId?: string
}

export function CorsOriginErrorScreen(props: CorsOriginErrorScreenProps) {
  const {projectId} = props

  const corsUrl = `https://sanity.io/manage/project/${projectId}/settings/api`
  const origin = window.location.origin

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <Card height="fill">
      <Dialog
        id="cors-error-dialog"
        header="Error"
        width={1}
        footer={
          <Stack paddingX={3} paddingY={2}>
            <Button text="Retry" onClick={handleRetry} />
          </Stack>
        }
      >
        <Stack paddingX={4} paddingY={5} space={4}>
          <Text>
            It looks like the error is being caused by the current origin (<code>{origin}</code>)
            not being allowed for this project.
          </Text>

          <Text>
            If you are a project administrator or developer, you can head to{' '}
            <a rel="noopener noreferrer" target="_blank" href={corsUrl}>
              the project management
            </a>{' '}
            interface to configure CORS origins for this project.
          </Text>

          <Text>
            <a
              href="https://www.sanity.io/docs/front-ends/cors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read more about CORS Origins
            </a>
            .
          </Text>
        </Stack>
      </Dialog>
    </Card>
  )
}
