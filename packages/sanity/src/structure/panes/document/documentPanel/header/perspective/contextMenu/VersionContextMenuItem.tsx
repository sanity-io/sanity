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
          {release.metadata?.title || t('release.placeholder-untitled-release')}
        </Text>
        <Text muted size={1}>
          {release.metadata.releaseType === 'asap' && <>{t('release.type.asap')}</>}
          {release.metadata.releaseType === 'scheduled' &&
            (release.metadata.intendedPublishAt ? (
              <>{dateTimeFormat.format(new Date(release.metadata.intendedPublishAt))}</>
            ) : (
              /** @todo add date when it's scheduled and not just with a date */
              <>{t('release.chip.tooltip.unknown-date')}</>
            ))}
          {release.metadata.releaseType === 'undecided' && <>{t('release.type.undecided')}</>}
        </Text>
      </Stack>
    </Flex>
  )
})
