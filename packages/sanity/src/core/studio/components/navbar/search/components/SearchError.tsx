import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Flex, Box} from 'ui5'

import {TextWithTone} from '../../../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'

export function SearchError() {
  const {t} = useTranslation()

  return (
    <Flex
      alignItems="center"
      aria-live="assertive"
      flexDirection="column"
      flexBasis="0%"
      flexGrow={1}
      gap={3}
      marginY={2}
      padding={4}
    >
      <Box marginBottom={1}>
        <TextWithTone tone="critical">
          <WarningOutlineIcon />
        </TextWithTone>
      </Box>
      <TextWithTone size={2} tone="critical" weight="medium">
        {t('search.error.unspecified-error-title')}
      </TextWithTone>
      <TextWithTone size={1} tone="critical">
        {t('search.error.unspecified-error-help-description')}
      </TextWithTone>
    </Flex>
  )
}
