import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Stack} from '@sanity/ui'
import {Flex, Box, type PaddingProps} from 'ui5'

import {TextWithTone} from '../../../../../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../../../../../i18n/hooks/useTranslation'

export function FilterError(props: PaddingProps) {
  const {t} = useTranslation()

  return (
    <Box {...props}>
      <Flex alignItems="flex-start" gap={3}>
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
