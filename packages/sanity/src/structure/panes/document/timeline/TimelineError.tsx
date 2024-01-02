import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Stack} from '@sanity/ui'
import React from 'react'
import {TextWithTone, useTranslation} from 'sanity'

export function TimelineError() {
  const {t} = useTranslation('studio')

  return (
    <Flex align="flex-start" gap={3} padding={4}>
      <TextWithTone tone="critical">
        <ErrorOutlineIcon />
      </TextWithTone>
      <Stack space={4}>
        <TextWithTone size={1} tone="critical" weight="medium">
          {t('timeline.error.load-document-changes-title')}
        </TextWithTone>
        <TextWithTone size={1} tone="critical">
          {t('timeline.error.load-document-changes-description')}
        </TextWithTone>
      </Stack>
    </Flex>
  )
}
