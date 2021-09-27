import {EditIcon, SyncIcon} from '@sanity/icons'
import {useSyncState} from '@sanity/react-hooks'
import {ButtonProps, Box, Flex, Text, Button} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {useDocumentHistory} from '../../documentHistory'
import {AnimatedSyncIcon} from './AnimatedSyncIcon.styled'

export interface ReviewChangesButtonProps
  extends Omit<ButtonProps, 'mode' | 'onClick' | 'padding' | 'selected' | 'tone' | 'type'> {
  lastUpdatedTimeAgo: string
}

export const ReviewChangesButton = forwardRef(function ReviewChangesButton(
  props: ReviewChangesButtonProps & React.HTMLProps<HTMLButtonElement>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {lastUpdatedTimeAgo} = props

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
          {lastUpdatedTimeAgo || <>&nbsp;</>}
        </Text>
      </Flex>
    </Button>
  )
})
