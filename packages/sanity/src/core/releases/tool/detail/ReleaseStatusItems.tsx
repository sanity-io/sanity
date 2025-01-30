import {Flex} from '@sanity/ui'
import {useMemo} from 'react'

import {AvatarSkeleton, RelativeTime, UserAvatar} from '../../../components'
import {useTranslation} from '../../../i18n'
import {isNonNullable} from '../../../util/isNonNullable'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {StatusItem} from '../components/StatusItem'
import {
  isArchiveReleaseEvent,
  isCreateReleaseEvent,
  isPublishReleaseEvent,
  isUnarchiveReleaseEvent,
  type ReleaseEvent,
} from './events/types'

const STATUS_TITLE_I18N = {
  createRelease: 'footer.status.created',
  publishRelease: 'footer.status.published',
  archiveRelease: 'footer.status.archived',
  unarchiveRelease: 'footer.status.unarchived',
}
export function ReleaseStatusItems({
  events,
  release,
}: {
  events: ReleaseEvent[]
  release: ReleaseDocument
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const footerEvents = useMemo(() => {
    const createEvent = events.find(isCreateReleaseEvent)
    const extraEvent = events.find(
      (event) =>
        isPublishReleaseEvent(event) ||
        isArchiveReleaseEvent(event) ||
        isUnarchiveReleaseEvent(event),
    )
    return [createEvent, extraEvent].filter(isNonNullable)
  }, [events])

  if (!footerEvents.length) {
    return (
      <Flex flex={1} gap={1}>
        <StatusItem
          avatar={<AvatarSkeleton $size={0} />}
          text={
            <>
              {t(STATUS_TITLE_I18N.createRelease)}{' '}
              <RelativeTime time={release._createdAt} useTemporalPhrase minimal />
            </>
          }
        />
      </Flex>
    )
  }
  return (
    <Flex flex={1} gap={1}>
      {footerEvents.map((event) => (
        <StatusItem
          key={event.id}
          testId={`status-${event.type}`}
          avatar={event.author && <UserAvatar size={0} user={event.author} />}
          text={
            <>
              {t(STATUS_TITLE_I18N[event.type])}{' '}
              <RelativeTime time={event.timestamp} useTemporalPhrase minimal />
            </>
          }
        />
      ))}
    </Flex>
  )
}
