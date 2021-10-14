import {useTimeAgo} from '@sanity/base/hooks'
import {EditIcon, RestoreIcon, SyncIcon} from '@sanity/icons'
import {useSyncState} from '@sanity/react-hooks'
import {ButtonProps, Box, Flex, Text} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {Root, TextBox} from './ReviewChangesButton.styled'

export interface ReviewChangesButtonProps
  extends Omit<ButtonProps, 'mode' | 'onClick' | 'padding' | 'selected' | 'tone' | 'type'> {
  lastUpdated?: string
}

export const ReviewChangesButton = forwardRef(function ReviewChangesButton(
  props: ReviewChangesButtonProps & React.HTMLProps<HTMLButtonElement>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {lastUpdated, ...restProps} = props
  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})
  const {documentId, handleHistoryClose, handleHistoryOpen, changesOpen} = useDocumentPane()
  const syncState = useSyncState(documentId)

  return (
    <Root
      {...restProps}
      mode="ghost"
      onClick={changesOpen ? handleHistoryClose : handleHistoryOpen}
      padding={3}
      ref={ref}
      selected={changesOpen}
      title="Review changes"
      tone="caution"
    >
      <Flex align="center">
        <Box marginRight={3}>
          <Text>
            {syncState.isSyncing ? (
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
