import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Stack} from '@sanity/ui'
import {TextWithTone, useTranslation} from 'sanity'
import {Flex} from 'ui5'

export function TimelineError({versionError}: {versionError?: boolean}) {
  const {t} = useTranslation('studio')

  return (
    <Flex alignItems="flex-start" gap={3} padding={4}>
      <TextWithTone tone="critical">
        <ErrorOutlineIcon />
      </TextWithTone>
      <Stack gap={4}>
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
      </Stack>
    </Flex>
  )
}
