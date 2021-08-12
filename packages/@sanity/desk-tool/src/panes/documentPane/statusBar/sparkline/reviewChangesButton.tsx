import {EditIcon, RestoreIcon, SyncIcon} from '@sanity/icons'
import {useSyncState} from '@sanity/react-hooks'
import {ButtonProps, Box, Flex, Text} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {useDocumentHistory} from '../../documentHistory'
import {Root, TextBox} from './reviewChangesButton.styled'

export interface ReviewChangesButtonProps
  extends Omit<ButtonProps, 'mode' | 'onClick' | 'padding' | 'selected' | 'tone' | 'type'> {
  lastUpdatedTimeAgo: string
}

export const ReviewChangesButton = forwardRef(function ReviewChangesButton(
  props: ReviewChangesButtonProps & React.HTMLProps<HTMLButtonElement>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {lastUpdatedTimeAgo, ...restProps} = props

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
    <Root
      {...restProps}
      mode="ghost"
      onClick={open ? closeReviewChanges : openReviewChanges}
      padding={3}
      ref={ref}
      selected={open}
      title="Review changes"
      tone="caution"
    >
      <Flex align="center">
        <Box marginRight={3}>
          <Text>
            {syncing ? (
              <SyncIcon data-icon-enabled="" data-spin="" />
            ) : (
              <EditIcon data-icon-enabled="" />
            )}
            <RestoreIcon data-icon-hovered="" />
          </Text>
        </Box>

        <TextBox flex={1}>
          <Text size={0} weight="semibold">
            Changed
          </Text>
          <Box marginTop={1}>
            <Text size={0}>{lastUpdatedTimeAgo || <>&nbsp;</>}</Text>
          </Box>
        </TextBox>
      </Flex>
    </Root>
  )
})
