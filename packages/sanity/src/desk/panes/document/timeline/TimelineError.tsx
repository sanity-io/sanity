import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Stack} from '@sanity/ui'
import React from 'react'
import {deskLocaleNamespace} from '../../../i18n'
import {TextWithTone, useTranslation} from 'sanity'

export function TimelineError() {
  const {t} = useTranslation(deskLocaleNamespace)

  return (
    <Flex align="flex-start" gap={3} padding={4}>
      <TextWithTone tone="critical">
        <ErrorOutlineIcon />
      </TextWithTone>
      <Stack space={4}>
        <TextWithTone size={1} tone="critical" weight="semibold">
          {t('desk.timeline.error-title')}
        </TextWithTone>
        <TextWithTone size={1} tone="critical">
          {t('desk.timeline.error-description')}
        </TextWithTone>
      </Stack>
    </Flex>
  )
}
