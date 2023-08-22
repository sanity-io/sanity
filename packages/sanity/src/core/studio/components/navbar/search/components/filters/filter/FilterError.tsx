import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Flex, ResponsivePaddingProps, Stack} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../../../components'
import {useTranslation} from '../../../../../../../i18n'

export function FilterError(props: ResponsivePaddingProps) {
  const {t} = useTranslation()

  return (
    <Box {...props}>
      <Flex align="flex-start" gap={3}>
        <TextWithTone tone="critical">
          <ErrorOutlineIcon />
        </TextWithTone>
        <Stack space={4}>
          <TextWithTone size={1} tone="critical" weight="semibold">
            {t('navbar.search.error.display-filter-title')}
          </TextWithTone>
          <TextWithTone size={1} tone="critical">
            {t('navbar.search.error.display-filter-description')}
          </TextWithTone>
        </Stack>
      </Flex>
    </Box>
  )
}
