import {Button, Card, Code, ErrorBoundary, Stack} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {SanityDefaultPreview, PreviewLoader} from '../../../../../preview'

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

  // NOTE: Hacky way to preview a block image in the Workshop
  if (props.type?.type?.name === 'image') {
    return (
      <SanityDefaultPreview
        {...props}
        _renderAsBlockImage
        layout="block"
        value={{media: <img src="https://source.unsplash.com/960x960/?tree" />, ...props.value}}
      />
    )
  }

  return (
    <ErrorBoundary onCatch={handleCatch}>
      <PreviewLoader {...props} />
    </ErrorBoundary>
  )
}
