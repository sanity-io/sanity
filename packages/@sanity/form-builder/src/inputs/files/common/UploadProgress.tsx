import React, {useEffect} from 'react'
import {Flex, Text, Button, Stack, Inline, Card, Code} from '@sanity/ui'
import {LinearProgress} from '@sanity/base/components'
import {UploadState} from '../types'
import {FlexWrapper, LeftSection, CodeWrapper} from './UploadProgress.styled'

type Props = {
  uploadState: UploadState
  onCancel?: () => void
  onStale?: () => void
}

// If it's more than this amount of milliseconds since last time upload state was reported,
// the upload will be marked as stale/interrupted.
const STALE_UPLOAD_MS = 1000 * 60 * 2 // 2 minutes

const elapsedMs = (date: string): number => new Date().getTime() - new Date(date).getTime()

export function UploadProgress({uploadState, onCancel, onStale}: Props) {
  const filename = uploadState.file.name

  useEffect(() => {
    if (elapsedMs(uploadState.updated) > STALE_UPLOAD_MS) {
      onStale()
    }
  }, [uploadState.updated, onStale])

  return (
    <Card tone="primary" padding={4} border>
      <FlexWrapper align="center" justify="space-between" height="fill" direction="row" gap={2}>
        <LeftSection>
          <Flex justify="center" gap={[3, 3, 2, 2]} direction={['column', 'column', 'row']}>
            <Text size={1}>
              <Inline space={2}>
                Uploading
                <CodeWrapper size={1}>{filename ? filename : '...'}</CodeWrapper>
              </Inline>
            </Text>
          </Flex>

          <Card marginTop={3} radius={5} shadow={1}>
            <LinearProgress value={uploadState.progress} />
          </Card>
        </LeftSection>

        <Button fontSize={2} text="Cancel upload" mode="ghost" tone="critical" onClick={onCancel} />
      </FlexWrapper>
    </Card>
  )
}
