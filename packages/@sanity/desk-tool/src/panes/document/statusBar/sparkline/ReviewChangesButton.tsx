import {useTimeAgo} from '@sanity/base/hooks'
import {EditIcon} from '@sanity/icons'
import {useSyncState} from '@sanity/react-hooks'
import {ButtonProps, Box, Flex, Text, Stack, Button} from '@sanity/ui'
import {Tooltip} from 'part:@sanity/components/tooltip'
import React, {forwardRef} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {AnimatedSyncIcon} from './AnimatedSyncIcon.styled'

export interface ReviewChangesButtonProps
  extends Omit<ButtonProps, 'mode' | 'onClick' | 'padding' | 'selected' | 'tone' | 'type'> {
  lastUpdated?: string
}

export const ReviewChangesButton = forwardRef(function ReviewChangesButton(
  props: ReviewChangesButtonProps & React.HTMLProps<HTMLButtonElement>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {lastUpdated} = props
  const lastUpdatedTime = useTimeAgo(lastUpdated || '', {minimal: true})
  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})
  const {
    documentId,
    documentType,
    handleHistoryClose,
    handleHistoryOpen,
    changesOpen,
  } = useDocumentPane()
  const syncState = useSyncState(documentId, documentType)

  return (
    <Tooltip
      content={
        <Stack padding={3} space={3}>
          <Text size={1} weight="semibold">
            Review changes
          </Text>
          <Text size={1} muted>
            Changes saved {lastUpdatedTimeAgo}
          </Text>
        </Stack>
      }
    >
      <Button
        aria-label="Review changes"
        mode="bleed"
        tone="caution"
        padding={3}
        onClick={changesOpen ? handleHistoryClose : handleHistoryOpen}
        ref={ref}
        selected={changesOpen}
        data-testid="review-changes-button"
      >
        <Flex align="center">
          <Box marginRight={3}>
            <Text size={2}>{syncState.isSyncing ? <AnimatedSyncIcon /> : <EditIcon />}</Text>
          </Box>
          <Text size={1} weight="medium">
            {lastUpdatedTime || <>&nbsp;</>}
          </Text>
        </Flex>
      </Button>
    </Tooltip>
  )
})
