import {useTimeAgo} from '@sanity/base/hooks'
import {EditIcon} from '@sanity/icons'
import {useSyncState} from '@sanity/react-hooks'
import {ButtonProps, Box, Flex, Text, Stack, Button} from '@sanity/ui'
import {Tooltip} from 'part:@sanity/components/tooltip'
import React, {forwardRef, useRef, useState, useEffect} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {AnimatedIcons} from './AnimatedIcons'
// import {AnimatedSyncIcon} from './AnimatedSyncIcon.styled'

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
  const [currentState, setCurrentState] = useState('init')
  const savedTimer = useRef()
  const changesTimer = useRef()

  // useEffect(() => {
  //   if (syncState.isSyncing && currentState !== 'init') {
  //     setCurrentState('syncing')
  //     const syncedTimer = setTimeout(() => setCurrentState('synced'), 1000)
  //     const moreTimeTimer = setTimeout(() => setCurrentState('changed'), 5000)
  //     return () => {
  //       clearTimeout(syncedTimer)
  //       clearTimeout(moreTimeTimer)
  //     }
  //   } else if (currentState === 'init') {
  //     setCurrentState('')
  //   }
  // }, [syncState])

  useEffect(() => {
    console.log(lastUpdatedTime)
    if (syncState.isSyncing && currentState !== 'init') {
      setCurrentState('syncing')
      clearInterval(savedTimer.current)
      clearInterval(changesTimer.current)
    }

    if (!syncState.isSyncing && currentState !== 'init') {
      savedTimer.current = setTimeout(() => setCurrentState('synced'), 1500)
      changesTimer.current = setTimeout(() => setCurrentState('changed'), 5000)
    }

    if (currentState === 'init') {
      setCurrentState('')
    }
  }, [syncState])

  const stateToTone = {
    syncing: 'default',
    synced: 'positive',
    changed: 'caution',
  }

  const stateToText = {
    syncing: 'Saving...',
    synced: 'Saved',
    changed: lastUpdatedTime
  }

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
        tone={stateToTone[currentState] || 'caution'}
        padding={2}
        onClick={changesOpen ? handleHistoryClose : handleHistoryOpen}
        ref={ref}
        selected={changesOpen}
      >
        <Flex align="center">
          <AnimatedIcons currentState={currentState} />
          <Box marginLeft={2}>
            <Text size={1} weight="medium">
              {stateToText[currentState] || lastUpdatedTime}
            </Text>
          </Box>
        </Flex>
      </Button>
    </Tooltip>
  )
})
