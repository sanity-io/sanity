import {ButtonTone, Flex, Text} from '@sanity/ui'
import React from 'react'
import {AnimatedStatusIcon} from './AnimatedStatusIcon'
import {structureLocaleNamespace} from '../../../../i18n'
import {TextWithTone, useTranslation} from 'sanity'

type StatusType = 'saved' | 'syncing'
interface ReviewChangesButtonProps {
  status?: StatusType
}

const STATUS_DICTIONARY: Record<StatusType, {i18nKey: string; tone: ButtonTone}> = {
  saved: {
    i18nKey: 'status-bar.document-status-pulse.status.saved.text',
    tone: 'positive',
  },
  syncing: {
    i18nKey: 'status-bar.document-status-pulse.status.syncing.text',
    tone: 'default',
  },
}

export const DocumentStatusPulse = (props: ReviewChangesButtonProps) => {
  const {status} = props
  const {t} = useTranslation(structureLocaleNamespace)

  if (status !== 'saved' && status !== 'syncing') {
    return null
  }

  const currentStatus = STATUS_DICTIONARY[status]

  return (
    <Flex align="center" gap={2}>
      <TextWithTone size={1} tone={currentStatus.tone}>
        <AnimatedStatusIcon status={status} />
      </TextWithTone>

      <Text muted size={1}>
        {t(currentStatus.i18nKey)}
      </Text>
    </Flex>
  )
}
