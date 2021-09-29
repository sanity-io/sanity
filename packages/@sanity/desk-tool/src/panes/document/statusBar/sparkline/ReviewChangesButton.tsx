import {EditIcon} from '@sanity/icons'
import {useSyncState} from '@sanity/react-hooks'
import {ButtonProps, Box, Flex, Text, Button, Tooltip, Stack} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {useDocumentHistory} from '../../documentHistory'
import {AnimatedSyncIcon} from './AnimatedSyncIcon.styled'

export interface ReviewChangesButtonProps
  extends Omit<ButtonProps, 'mode' | 'onClick' | 'padding' | 'selected' | 'tone' | 'type'> {
  lastUpdatedTimeAgo: string
  lastUpdatedTime: string
}

export const ReviewChangesButton = forwardRef(function ReviewChangesButton(
  props: ReviewChangesButtonProps & React.HTMLProps<HTMLButtonElement>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {lastUpdatedTime, lastUpdatedTimeAgo} = props

  const {
    close: closeReviewChanges,
    historyController,
    open: openReviewChanges,
    timeline,
  } = useDocumentHistory()

  const open = historyController.changesPanelActive()
  const syncState = useSyncState(timeline?.publishedId)
  const syncing = syncState.isSyncing

  return (
    <Tooltip
      content={
        <Stack padding={3} space={3}>
          <Text size={1} weight="semibold">
            Review changes
          </Text>
          <Text size={1} muted>
            Latest changes saved {lastUpdatedTimeAgo}
          </Text>
        </Stack>
      }
    >
      <Button
        mode="bleed"
        tone="caution"
        padding={3}
        onClick={open ? closeReviewChanges : openReviewChanges}
        ref={ref}
        selected={open}
        title="Review changes"
      >
        <Flex align="center">
          <Box marginRight={3}>
            <Text size={3}>{syncing ? <AnimatedSyncIcon /> : <EditIcon />}</Text>
          </Box>
          <Text size={1} weight="medium">
            {lastUpdatedTime || <>&nbsp;</>}
          </Text>
        </Flex>
      </Button>
    </Tooltip>
  )
})
