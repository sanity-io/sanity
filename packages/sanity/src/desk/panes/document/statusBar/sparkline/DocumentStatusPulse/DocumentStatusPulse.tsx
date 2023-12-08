import {ButtonTone, Flex} from '@sanity/ui'
import React from 'react'
import {AnimatedStatusIcon} from './AnimatedStatusIcon'
import {TextWithTone} from 'sanity'

type StatusType = 'saved' | 'syncing'
interface ReviewChangesButtonProps {
  status?: StatusType
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
  const {status} = props

  if (status !== 'saved' && status !== 'syncing') {
    return null
  }

  const currentStatus = STATUS_DICTIONARY[status]

  return (
    <Flex align="center" gap={2}>
      <Flex align="center" justify="center" style={{width: '1em'}}>
        <TextWithTone size={1} tone={currentStatus.tone}>
          <AnimatedStatusIcon status={status} />
        </TextWithTone>
      </Flex>
      <TextWithTone size={1} tone={currentStatus.tone}>
        {currentStatus.text}
      </TextWithTone>
    </Flex>
  )
}
