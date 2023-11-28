import {Stack, Text} from '@sanity/ui'
import React from 'react'
import {useTranslation} from '../../../i18n'

/** @internal */
export function NoChanges() {
  const {t} = useTranslation()
  return (
    <Stack space={3}>
      <Text size={1} weight="semibold" as="h3">
        {t('core.review-changes.no-changes-title')}
      </Text>
      <Text as="p" size={1} muted>
        {t('core.review-changes.no-changes-description')}
      </Text>
    </Stack>
  )
}
