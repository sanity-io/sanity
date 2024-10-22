/* eslint-disable i18next/no-literal-string */
import {Flex, Stack, Text} from '@sanity/ui'
import {memo} from 'react'
import {
  getReleaseTone,
  ReleaseAvatar,
  type ReleaseDocument,
  useDateTimeFormat,
  useTranslation,
} from 'sanity'

export const VersionContextMenuItem = memo(function VersionContextMenuItem(props: {
  release: ReleaseDocument
}) {
  const {release} = props
  const {t} = useTranslation()
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <Flex gap={3}>
      <ReleaseAvatar padding={2} tone={getReleaseTone(release)} />
      <Stack flex={1} space={2}>
        <Text size={1} weight="medium">
          {release.title}
        </Text>
        <Text muted size={1}>
          {release.releaseType === 'asap' && <>{t('release.type.asap')}</>}
          {release.releaseType === 'scheduled' &&
            (release.publishedAt ? (
              <>{dateTimeFormat.format(new Date(release.publishedAt))}</>
            ) : (
              /** @todo add date when it's scheduled and not just with a date */
              <>{t('release.chip.tooltip.unknown-date')}</>
            ))}
          {release.releaseType === 'undecided' && <>{t('release.type.undecided')}</>}
        </Text>
      </Stack>
    </Flex>
  )
})
