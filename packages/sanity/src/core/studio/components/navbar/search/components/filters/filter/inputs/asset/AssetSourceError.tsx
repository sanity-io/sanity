import i18n from 'i18next'
import k from './../../../../../../../../../../i18n/keys'
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Flex, ResponsivePaddingProps, Stack} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from '../../../../../../../../../components'

export function AssetSourceError(props: ResponsivePaddingProps) {
  return (
    <Box {...props}>
      <Flex align="flex-start" gap={3}>
        <TextWithTone tone="caution">
          <WarningOutlineIcon />
        </TextWithTone>
        <Stack space={4}>
          <TextWithTone size={1} tone="caution" weight="semibold">
            {i18n.t(k.NO_VALID_ASSET_SOURCES_FOUND)}
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            {i18n.t(k.CURRENTLY_ONLY_THE_DEFAULT_AS)}
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            {i18n.t(k.PLEASE_ENSURE_IT_S_ENABLED_IN)}
          </TextWithTone>
        </Stack>
      </Flex>
    </Box>
  )
}
