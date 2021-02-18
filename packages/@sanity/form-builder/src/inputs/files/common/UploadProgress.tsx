import prettyMs from 'pretty-ms'
import React from 'react'
import {Flex, Box, Text, Button, Stack} from '@sanity/ui'
import {TrashIcon, WarningOutlineIcon} from '@sanity/icons'
import {CircularProgress} from '../../../components/progress'
import {UploadState} from '../types'

// If it's more than this amount of milliseconds since last time upload state was reported,
// the upload will be marked as stale/interrupted.
const STALE_UPLOAD_MS = 1000 * 60 * 2 // 2 minutes

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
  const shouldShowCancelButton = Boolean(onCancel)
  const shouldShowRemoveButton = Boolean(isStale && onClearStale)

  return (
    <Box padding={2}>
      {isStale && (
        <Stack space={3}>
          <Flex justify="center" marginTop={3}>
            <Text size={1}>
              <WarningOutlineIcon />
            </Text>

            <Box marginLeft={2}>
              <Text size={1} weight="medium">
                Incomplete upload
              </Text>
            </Box>
          </Flex>

          <Text align="center" muted size={1}>
            This upload made no progress in the last{' '}
            {prettyMs(elapsedMs(uploadState.updated), {compact: true})} and likely got interrupted.
          </Text>
        </Stack>
      )}

      {!isStale && (
        <Flex direction="column" align="center">
          <Box>
            <CircularProgress value={completed ? 100 : uploadState.progress} />
          </Box>

          <Box marginTop={3}>
            <Text align="center" muted size={1}>
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
        </Flex>
      )}

      {(shouldShowCancelButton || shouldShowRemoveButton) && (
        <Stack marginTop={4} space={1}>
          {shouldShowCancelButton && (
            <Button fontSize={1} mode="ghost" color="danger" onClick={onCancel} text="Cancel" />
          )}

          {shouldShowRemoveButton && (
            <Button
              fontSize={1}
              mode="ghost"
              onClick={onClearStale}
              icon={TrashIcon}
              text="Remove incomplete file"
              tone="critical"
            />
          )}
        </Stack>
      )}
    </Box>
  )
}
