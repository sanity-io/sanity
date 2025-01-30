import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Stack} from '@sanity/ui'
import {TextWithTone, useTranslation} from 'sanity'

export function TimelineError({versionError}: {versionError?: boolean}) {
  const {t} = useTranslation('studio')

  return (
    <Flex align="flex-start" gap={3} padding={4}>
      <TextWithTone tone="critical">
        <ErrorOutlineIcon />
      </TextWithTone>
      <Stack space={4}>
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
