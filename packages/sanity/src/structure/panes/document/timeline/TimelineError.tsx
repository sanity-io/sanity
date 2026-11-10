import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {TextWithTone, useTranslation} from 'sanity'
import {Box, Flex, Icon, VStack} from 'ui5'

export function TimelineError({versionError}: {versionError?: boolean}) {
  const {t} = useTranslation('studio')

  return (
    <Flex alignItems="flex-start" gap={3} padding={4}>
      <Box flexShrink={0}>
        <Icon icon={ErrorOutlineIcon} style={{margin: '-0.4375rem'}} />
      </Box>
      <VStack gap={4}>
        <TextWithTone size={1} tone="critical" weight="medium">
          {versionError
            ? t('timeline.error.load-document-changes-version-title')
            : t('timeline.error.load-document-changes-title')}
        </TextWithTone>
        <TextWithTone size={1} tone="critical">
          {versionError
            ? t('timeline.error.load-document-changes-version-description')
            : t('timeline.error.load-document-changes-description')}
        </TextWithTone>
      </VStack>
    </Flex>
  )
}
