import {Card, Code, ErrorBoundary, Stack} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {PreviewLoader} from '../../../preview'
import {Button} from '../../../../ui-components'

export const resolvePreviewComponent = () => TestPreview

interface ErrorParams {
  error: Error
  info: React.ErrorInfo
}

function TestPreview(props: any) {
  const [errorParams, setErrorParams] = useState<ErrorParams | null>(null)

  const handleCatch = useCallback((params: ErrorParams) => {
    setErrorParams(params)
  }, [])

  const handleRetry = useCallback(() => setErrorParams(null), [])

  if (errorParams) {
    return (
      <Card padding={3} tone="critical">
        <Code language="json">{JSON.stringify(errorParams)}</Code>
        <Stack marginTop={3}>
          <Button onClick={handleRetry} text="Retry" />
        </Stack>
      </Card>
    )
  }
  return (
    <ErrorBoundary onCatch={handleCatch}>
      <PreviewLoader {...props} />
    </ErrorBoundary>
  )
}
