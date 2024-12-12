import {Card, Flex, Stack, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {memo, useMemo} from 'react'
import {styled} from 'styled-components'

import {RelativeTime} from '../../../components/RelativeTime'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {useDateTimeFormat} from '../../../hooks/useDateTimeFormat'
import {Translate, useTranslation} from '../../../i18n'
import {useDocumentPreviewValues} from '../../../tasks/hooks'
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
} from './activity/types'

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
  AddDocumentToRelease: 'activity.event.add-document',
  ArchiveRelease: 'activity.event.archive',
  CreateRelease: 'activity.event.create',
  DiscardDocumentFromRelease: 'activity.event.discard-document',
  PublishRelease: 'activity.event.publish',
  ScheduleRelease: 'activity.event.schedule',
  UnarchiveRelease: 'activity.event.unarchive',
  UnscheduleRelease: 'activity.event.unschedule',
  releaseEditEvent: 'activity.event.edit',
}

const ReleaseEventDocumentPreview = ({
  event,
  releaseId,
}: {
  releaseId: string
  event: AddDocumentToReleaseEvent | DiscardDocumentFromReleaseEvent
}) => {
  // TODO: Get this from the event
  const documentType = 'author'
  const {value, isLoading} = useDocumentPreviewValues({
    documentId: event.documentId,
    documentType: documentType,
  })
  return (
    <Stack space={2}>
      <ReleaseDocumentPreview
        releaseId={releaseId}
        documentId={event.documentId}
        isLoading={isLoading}
        previewValues={{...value, subtitle: ''}}
        documentTypeName={documentType}
        layout="block"
      />
    </Stack>
  )
}

const ScheduleTarget = ({children, event}: {children: React.ReactNode; event: ReleaseEvent}) => {
  const dateTimeFormat = useDateTimeFormat({dateStyle: 'full', timeStyle: 'medium'})

  const formattedDate = useMemo(() => {
    if (isEditReleaseEvent(event)) {
      if (event.change.releaseType === 'asap') return 'immediately'
      if (event.change.releaseType === 'undecided') return 'never'
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
  }, [dateTimeFormat, event])

  if (!formattedDate && isCreateReleaseEvent(event)) return null
  return (
    <span>
      {children} <strong>{formattedDate || '---'}</strong>
    </span>
  )
}

const FadeInCard = motion(Card)
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
        <Flex align="flex-start" gap={2}>
          <UserAvatar user={event.author} />
          <Stack flex={1}>
            <Flex gap={2} paddingY={2}>
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
                &middot; <RelativeTime time={event.timestamp} useTemporalPhrase minimal />
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
