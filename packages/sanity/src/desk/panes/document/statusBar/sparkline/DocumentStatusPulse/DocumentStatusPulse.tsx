import {ButtonTone, Flex, Inline} from '@sanity/ui'
import React from 'react'
import {AnimatedStatusIcon} from './AnimatedStatusIcon'
import {TextWithTone} from 'sanity'

type StatusType = 'saved' | 'syncing'
interface ReviewChangesButtonProps
  extends Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'width' | 'as' | 'type'> {
  status?: StatusType
  collapsed?: boolean
}

const STATUS_DICTIONARY: Record<StatusType, {text: string; tone: ButtonTone}> = {
  saved: {
    text: 'Saved!',
    tone: 'positive',
  },
  syncing: {
    text: 'Saving...',
    tone: 'default',
  },
}

export const DocumentStatusPulse = (props: ReviewChangesButtonProps) => {
  const {collapsed, status} = props

  if (status !== 'saved' && status !== 'syncing') {
    return null
  }

  const currentStatus = STATUS_DICTIONARY[status]

  return (
    <Flex align="center" gap={3} marginLeft={1}>
      <TextWithTone size={1} tone={currentStatus.tone}>
        <AnimatedStatusIcon status={status} />
      </TextWithTone>
      {!collapsed && (
        <TextWithTone size={1} tone={currentStatus.tone}>
          {currentStatus.text}
        </TextWithTone>
      )}
    </Flex>
  )
}
