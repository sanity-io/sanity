import {WarningOutlineIcon} from '@sanity/icons'
import {Box, type BoxProps, Flex, Stack} from '@sanity/ui'

import {TextWithTone} from '../../../../../../../../../components'
import {useTranslation} from '../../../../../../../../../i18n'

export function AssetSourceError(props: BoxProps) {
  const {t} = useTranslation()

  return (
    <Box {...props}>
      <Flex align="flex-start" gap={3}>
        <TextWithTone tone="caution">
          <WarningOutlineIcon />
        </TextWithTone>
        <Stack gap={4}>
          <TextWithTone size={1} tone="caution" weight="medium">
            {t('search.error.no-valid-asset-source-title')}
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            {t('search.error.no-valid-asset-source-only-default-description')}
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            {t('search.error.no-valid-asset-source-check-config-description')}
          </TextWithTone>
        </Stack>
      </Flex>
    </Box>
  )
}
