import React, {useEffect} from 'react'
import {Flex, Text, Button, Stack, Inline, Card, Code} from '@sanity/ui'
import {LinearProgress} from '../../../components/progress'
import {UploadState} from '../types'

type Props = {
  uploadState: UploadState
  onCancel?: () => void
}

export function UploadProgress({uploadState, onCancel}: Props) {
  const filename = uploadState.file.name

  return (
    <Card tone="primary" padding={4} border>
      <Flex align="center" justify="space-between" height="fill" direction="row" gap={2}>
        <Stack style={{width: '60%', position: 'relative'}}>
          <Text size={1} align="center">
            <Inline space={2}>
              Uploading
              {filename ? <Code size={1}>{filename}</Code> : <>...</>}
            </Inline>
          </Text>

          <Card marginTop={3} radius={5} shadow={1}>
            <LinearProgress value={uploadState.progress} />
          </Card>
        </Stack>

        <Button fontSize={2} text="Cancel upload" mode="ghost" tone="critical" onClick={onCancel} />
      </Flex>
    </Card>
  )
}
