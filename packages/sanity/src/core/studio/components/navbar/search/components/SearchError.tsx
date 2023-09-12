import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../../../i18n'

export function SearchError() {
  const {t} = useTranslation()

  return (
    <Flex
      align="center"
      aria-live="assertive"
      direction="column"
      flex={1}
      gap={3}
      marginY={2}
      padding={4}
    >
      <Box marginBottom={1}>
        <TextWithTone tone="critical">
          <WarningOutlineIcon />
        </TextWithTone>
      </Box>
      <TextWithTone size={2} tone="critical" weight="semibold">
        {t('search.error.unspecified-error-title')}
      </TextWithTone>
      <TextWithTone size={1} tone="critical">
        {t('search.error.unspecified-error-help-description')}
      </TextWithTone>
    </Flex>
  )
}
