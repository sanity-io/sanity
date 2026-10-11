import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Flex, type PaddingProps, VStack} from 'ui5'

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
        <VStack gap={4}>
          <TextWithTone size={1} tone="critical" weight="medium">
            {t('search.error.display-filter-title')}
          </TextWithTone>
          <TextWithTone size={1} tone="critical">
            {t('search.error.display-filter-description')}
          </TextWithTone>
        </VStack>
      </Flex>
    </Box>
  )
}
