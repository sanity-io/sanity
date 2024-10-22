/* eslint-disable i18next/no-literal-string */
import {Flex, Stack, Text} from '@sanity/ui'
import {memo} from 'react'
import {getReleaseTone, ReleaseAvatar, type ReleaseDocument, useDateTimeFormat} from 'sanity'

export const VersionContextMenuItem = memo(function VersionContextMenuItem(props: {
  release: ReleaseDocument
}) {
  const {release} = props
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <Flex gap={3}>
      <ReleaseAvatar padding={2} tone={getReleaseTone(release)} />
      <Stack flex={1} space={2}>
        <Text size={1} weight="medium">
          {release.metadata.title}
        </Text>
        <Text muted size={1}>
          {release.metadata.releaseType === 'asap' && <>ASAP</>}
          {release.metadata.releaseType === 'scheduled' &&
            (release.publishAt ? (
              <>{dateTimeFormat.format(new Date(release.publishAt))}</>
            ) : (
              /** @todo add date when it's scheduled and not just with a date */
              // eslint-disable-next-line i18next/no-literal-string
              <>No Date</>
            ))}
          {release.metadata.releaseType === 'undecided' && <>Undecided</>}
        </Text>
      </Stack>
    </Flex>
  )
})
