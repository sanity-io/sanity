import React, {useEffect} from 'react'
import {Flex, Text, Button, Inline, Card} from '@sanity/ui'
import {UploadState} from '@sanity/types'
import {LinearProgress} from '../../../../components'
import {CardWrapper, FlexWrapper, LeftSection, CodeWrapper} from './UploadProgress.styled'

type Props = {
  uploadState: UploadState
  onCancel?: () => void
  onStale?: () => void
  height?: number
}

// If it's more than this amount of milliseconds since last time upload state was reported,
// the upload will be marked as stale/interrupted.
const STALE_UPLOAD_MS = 1000 * 60 * 2 // 2 minutes

const elapsedMs = (date: string): number => new Date().getTime() - new Date(date).getTime()

export function UploadProgress({uploadState, onCancel, onStale, height}: Props) {
  const filename = uploadState.file.name

  useEffect(() => {
    if (elapsedMs(uploadState.updatedAt) > STALE_UPLOAD_MS) {
      onStale?.()
    }
  }, [uploadState.updatedAt, onStale])

  return (
    <CardWrapper tone="primary" padding={4} border style={{height: `${height}px`}}>
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

        {onCancel ? (
          <Button
            fontSize={2}
            text="Cancel upload"
            mode="ghost"
            tone="critical"
            onClick={onCancel}
          />
        ) : null}
      </FlexWrapper>
    </CardWrapper>
  )
}
