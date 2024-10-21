/* eslint-disable i18next/no-literal-string */
import {Flex, Stack, Text} from '@sanity/ui'
import {memo} from 'react'
import {type BundleDocument, useDateTimeFormat} from 'sanity'

import {ReleaseAvatar} from '../../../../../../../core/releases/tool/components/ReleaseAvatar'
import {getReleaseTone} from '../../../../../../../core/releases/util/getReleaseTone'

export const VersionContextMenuItem = memo(function VersionContextMenuItem(props: {
  release: BundleDocument
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
          {release.title}
        </Text>
        <Text muted size={1}>
          {release.releaseType === 'asap' && <>ASAP</>}
          {release.releaseType === 'scheduled' &&
            (release.publishedAt ? (
              <>{dateTimeFormat.format(new Date(release.publishedAt))}</>
            ) : (
              /** @todo add date when it's scheduled and not just with a date */
              // eslint-disable-next-line i18next/no-literal-string
              <>No Date</>
            ))}
          {release.releaseType === 'undecided' && <>Undecided</>}
        </Text>
      </Stack>
    </Flex>
  )
})
