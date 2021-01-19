import prettyMs from 'pretty-ms'
import React from 'react'
import {Flex, Box, Text, Button, Inline} from '@sanity/ui'
import {CloseIcon, WarningOutlineIcon} from '@sanity/icons'
import {CircularProgress} from '../../../components/progress'
import {UploadState} from '../types'

// If it's more than this amount of milliseconds since last time _upload state was reported
// the upload will be marked as stale/interrupted
const STALE_UPLOAD_MS = 1000 * 60 * 2

const elapsedMs = (date: string): number => new Date().getTime() - new Date(date).getTime()

type Props = {
  uploadState: UploadState
  onCancel?: () => void
  onClearStale?: () => void
}

export function UploadProgress({uploadState, onCancel, onClearStale}: Props) {
  const completed = uploadState.progress === 100
  const filename = uploadState.file.name

  const isStale = elapsedMs(uploadState.updated) > STALE_UPLOAD_MS

  return (
    <Flex>
      <Box padding={4}>
        <Flex direction="column" align="center">
          <CircularProgress value={completed ? 100 : uploadState.progress} />
          {isStale && (
            <>
              <Inline padding={2} flex={1} marginTop={3}>
                <Text size={1}>
                  <WarningOutlineIcon />
                </Text>{' '}
                <Box marginLeft={2}>
                  <Text size={1}>Upload stalled</Text>
                </Box>
              </Inline>
              <Box padding={2}>
                <Text muted size={1}>
                  This upload didn't make any progress in the last{' '}
                  {prettyMs(elapsedMs(uploadState.updated), {compact: true})} and likely got
                  interrupted.
                </Text>
              </Box>
            </>
          )}
          {!isStale && (
            <Box flex={1}>
              <Text muted size={1}>
                {completed && !isStale && <>Complete</>}
                {!completed && !isStale && (
                  <>
                    Uploading
                    {filename ? (
                      <>
                        {' '}
                        <code>{filename}</code>
                      </>
                    ) : (
                      <>…</>
                    )}
                  </>
                )}
              </Text>
            </Box>
          )}

          <Box marginTop={1}>
            {onCancel && <Button mode="bleed" color="danger" onClick={onCancel} text="Cancel" />}
            {isStale && onClearStale && (
              <Button
                fontSize={1}
                mode="bleed"
                onClick={onClearStale}
                icon={CloseIcon}
                text="Reset"
              />
            )}
          </Box>
        </Flex>
      </Box>
    </Flex>
  )
}
