import {Card, Flex, Stack, Text} from '@sanity/ui'
import {motion} from 'motion/react'
import {memo, type ReactNode, useMemo} from 'react'
import {styled} from 'styled-components'

import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {useDateTimeFormat} from '../../../hooks/useDateTimeFormat'
import {useRelativeTime} from '../../../hooks/useRelativeTime'
import {Translate, useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {ReleaseDocumentPreview} from '../components/ReleaseDocumentPreview'
import {
  type AddDocumentToReleaseEvent,
  type DiscardDocumentFromReleaseEvent,
  isAddDocumentToReleaseEvent,
  isCreateReleaseEvent,
  isDiscardDocumentFromReleaseEvent,
  isEditReleaseEvent,
  isScheduleReleaseEvent,
  type ReleaseEvent,
} from './events/types'

const StatusText = styled(Text)`
  strong {
    font-weight: 500;
    color: var(--card-fg-color);
  }
  time {
    white-space: nowrap;
  }
`
const ACTIVITY_TEXT_118N: Record<ReleaseEvent['type'], string> = {
  addDocumentToRelease: 'activity.event.add-document',
  archiveRelease: 'activity.event.archive',
  createRelease: 'activity.event.create',
  discardDocumentFromRelease: 'activity.event.discard-document',
  publishRelease: 'activity.event.publish',
  scheduleRelease: 'activity.event.schedule',
  unarchiveRelease: 'activity.event.unarchive',
  unscheduleRelease: 'activity.event.unschedule',
  editRelease: 'activity.event.edit',
}

const ReleaseEventDocumentPreview = ({
  event,
  releaseId,
}: {
  releaseId: string
  event: AddDocumentToReleaseEvent | DiscardDocumentFromReleaseEvent
}) => {
  return (
    <Stack space={2}>
      <ReleaseDocumentPreview
        releaseId={releaseId}
        documentId={event.documentId}
        documentTypeName={event.documentType}
        layout="block"
      />
    </Stack>
  )
}

const ScheduleTarget = ({children, event}: {children: ReactNode; event: ReleaseEvent}) => {
  const dateTimeFormat = useDateTimeFormat({dateStyle: 'full', timeStyle: 'medium'})
  const {t} = useTranslation(releasesLocaleNamespace)

  const formattedDate = useMemo(() => {
    if (isEditReleaseEvent(event)) {
      if (event.change.releaseType === 'asap') return t('activity.event.edit-time-asap')
      if (event.change.releaseType === 'undecided') return t('activity.event.edit-time-undecided')
    }

    let dateString: string | undefined
    if (isScheduleReleaseEvent(event)) {
      dateString = event.publishAt
    } else if (isCreateReleaseEvent(event)) {
      dateString = event.change?.intendedPublishDate
    } else if (isEditReleaseEvent(event)) {
      dateString = event.change.intendedPublishDate
    }

    if (!dateString) return null
    return dateTimeFormat.format(new Date(dateString))
  }, [dateTimeFormat, event, t])

  if (!formattedDate && isCreateReleaseEvent(event)) return null
  return (
    <span>
      {children} <strong>{formattedDate || '---'}</strong>
    </span>
  )
}

const FadeInCard = motion.create(Card)

function ActivityTimestamp({timestamp}: {timestamp: string}) {
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const date = useMemo(() => new Date(timestamp), [timestamp])
  const formattedDate = useMemo(() => dateTimeFormat.format(date), [dateTimeFormat, date])
  const relativeTime = useRelativeTime(date, {useTemporalPhrase: true, minimal: true})

  return (
    <time dateTime={date.toISOString()} title={relativeTime}>
      {formattedDate}
    </time>
  )
}

export const ReleaseActivityListItem = memo(
  ({
    event,
    releaseId,
    releaseTitle,
  }: {
    event: ReleaseEvent
    releaseId: string
    releaseTitle: string
  }) => {
    const {t} = useTranslation(releasesLocaleNamespace)

    return (
      <FadeInCard
        paddingX={1}
        paddingTop={1}
        paddingBottom={2}
        overflow="hidden"
        // This card animates on entrance when a new event is added, not for every event that is rendered.
        // So if the user is seeing the list and a new event lands, the list will animate the new event. (That is by the <AnimatePresence initial=false> component wrapping the list)
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{type: 'spring', bounce: 0, duration: 0.4}}
      >
        <Flex align="center" gap={2}>
          <UserAvatar user={event.author} />
          <Stack flex={1}>
            <Flex gap={2} align="center">
              <StatusText muted size={1}>
                <Translate
                  t={t}
                  components={{
                    ScheduleTarget: ({children}) => (
                      <ScheduleTarget event={event}>{children}</ScheduleTarget>
                    ),
                  }}
                  values={{releaseTitle}}
                  i18nKey={ACTIVITY_TEXT_118N[event.type]}
                />{' '}
                &middot; <ActivityTimestamp timestamp={event.timestamp} />
              </StatusText>
            </Flex>
            {isAddDocumentToReleaseEvent(event) || isDiscardDocumentFromReleaseEvent(event) ? (
              <ReleaseEventDocumentPreview event={event} releaseId={releaseId} />
            ) : null}
          </Stack>
        </Flex>
      </FadeInCard>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.event.id === nextProps.event.id && prevProps.releaseId === nextProps.releaseId
  },
)

ReleaseActivityListItem.displayName = 'ReleaseActivityListItem'
