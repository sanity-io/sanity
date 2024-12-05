import {Flex} from '@sanity/ui'

import {AvatarSkeleton, RelativeTime, UserAvatar} from '../../../components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {StatusItem} from '../components/StatusItem'
import {
  isArchiveReleaseEvent,
  isCreateReleaseEvent,
  isPublishReleaseEvent,
  isUnarchiveReleaseEvent,
  type ReleaseEvent,
} from './activity/types'

const STATUS_TITLE_I18N = {
  CreateRelease: 'footer.status.created',
  PublishRelease: 'footer.status.published',
  ArchiveRelease: 'footer.status.archived',
  UnarchiveRelease: 'footer.status.unarchived',
}
export function ReleaseStatusItems({
  events,
  release,
}: {
  events: ReleaseEvent[]
  release: ReleaseDocument
}) {
  const {t} = useTranslation(releasesLocaleNamespace)

  const footerEvent = events.find((event) => {
    return (
      isCreateReleaseEvent(event) ||
      isPublishReleaseEvent(event) ||
      isArchiveReleaseEvent(event) ||
      isUnarchiveReleaseEvent(event)
    )
  })

  if (!footerEvent) {
    return (
      <Flex flex={1} gap={1}>
        <StatusItem
          avatar={<AvatarSkeleton size={0} />}
          text={
            <>
              {t(STATUS_TITLE_I18N.CreateRelease)}{' '}
              <RelativeTime time={release._createdAt} useTemporalPhrase minimal />
            </>
          }
        />
      </Flex>
    )
  }
  return (
    <Flex flex={1} gap={1}>
      <StatusItem
        avatar={footerEvent.author && <UserAvatar size={0} user={footerEvent.author} />}
        text={
          <>
            {t(STATUS_TITLE_I18N[footerEvent.type])}{' '}
            <RelativeTime time={footerEvent.timestamp} useTemporalPhrase minimal />
          </>
        }
      />
    </Flex>
  )
}
