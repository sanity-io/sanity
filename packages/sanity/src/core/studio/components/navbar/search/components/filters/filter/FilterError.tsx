import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Box, Flex, Icon, type PaddingProps, VStack} from 'ui5'

import {TextWithTone} from '../../../../../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../../../../../i18n/hooks/useTranslation'

export function FilterError(props: PaddingProps) {
  const {t} = useTranslation()

  return (
    <Box {...props}>
      <Flex alignItems="flex-start" gap={3}>
        <Box flexShrink={0}>
          <Icon icon={ErrorOutlineIcon} style={{margin: '-0.4375rem'}} />
        </Box>
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
