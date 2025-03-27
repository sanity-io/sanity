import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, type BoxProps, Flex, Stack} from '@sanity/ui'

import {TextWithTone} from '../../../../../../../components'
import {useTranslation} from '../../../../../../../i18n'

export function FilterError(props: BoxProps) {
  const {t} = useTranslation()

  return (
    <Box {...props}>
      <Flex align="flex-start" gap={3}>
        <TextWithTone tone="critical">
          <ErrorOutlineIcon />
        </TextWithTone>
        <Stack gap={4}>
          <TextWithTone size={1} tone="critical" weight="medium">
            {t('search.error.display-filter-title')}
          </TextWithTone>
          <TextWithTone size={1} tone="critical">
            {t('search.error.display-filter-description')}
          </TextWithTone>
        </Stack>
      </Flex>
    </Box>
  )
}
