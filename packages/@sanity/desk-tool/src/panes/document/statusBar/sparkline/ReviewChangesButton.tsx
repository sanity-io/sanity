import {useTimeAgo} from '@sanity/base/hooks'
import {CheckmarkCircleIcon, CheckmarkIcon, EditIcon} from '@sanity/icons'
import {useSyncState} from '@sanity/react-hooks'
import {ButtonProps, Box, Flex, Text, Stack, Button} from '@sanity/ui'
import {Tooltip} from 'part:@sanity/components/tooltip'
import React, {forwardRef, useRef, useEffect, useState} from 'react'
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
  const [displayState, setDisplayState] = useState('changes')
  const [firstUpdate, setFirstUpdate] = useState(true)
  const savedTimer = useRef(null)
  const changesTimer = useRef(null)

  useEffect(() => {
    if (syncState.isSyncing) {
      setDisplayState('syncing')
      clearInterval(savedTimer.current)
      clearInterval(changesTimer.current)
    } else if (!firstUpdate) {
      setFirstUpdate(false)
      savedTimer.current = setTimeout(() => setDisplayState('saved'), 1500)
      changesTimer.current = setTimeout(() => setDisplayState('changes'), 10000)
    }
    if (firstUpdate) {
      setFirstUpdate(false)
    }
  }, [syncState])

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
      >
        <Flex align="center">
          <Box marginRight={3}>
            <Text size={2}>
              {displayState === 'changes' && <EditIcon />}
              {displayState === 'syncing' && <AnimatedSyncIcon />}
              {displayState === 'saved' && <CheckmarkIcon />}
            </Text>
          </Box>
          <Text size={1} weight="medium">
            {displayState === 'changes' && (lastUpdatedTime || <>&nbsp;</>)}
            {displayState === 'saved' && 'saved'}
            {displayState === 'syncing' && 'saving...'}
          </Text>
        </Flex>
      </Button>
    </Tooltip>
  )
})
