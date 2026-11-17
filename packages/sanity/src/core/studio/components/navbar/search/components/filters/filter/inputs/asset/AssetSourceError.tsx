import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Flex, Icon, type PaddingProps, VStack} from 'ui5'

import {TextWithTone} from '../../../../../../../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../../../../../../../i18n/hooks/useTranslation'

export function AssetSourceError(props: PaddingProps) {
  const {t} = useTranslation()

  return (
    <Box {...props}>
      <Flex alignItems="flex-start" gap={3}>
        <Box flexShrink={0}>
          <Icon icon={WarningOutlineIcon} style={{margin: '-0.4375rem'}} />
        </Box>
        <VStack gap={4}>
          <TextWithTone size={1} tone="caution" weight="medium">
            {t('search.error.no-valid-asset-source-title')}
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            {t('search.error.no-valid-asset-source-only-default-description')}
          </TextWithTone>
          <TextWithTone size={1} tone="caution">
            {t('search.error.no-valid-asset-source-check-config-description')}
          </TextWithTone>
        </VStack>
      </Flex>
    </Box>
  )
}
