import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {RelativeTime} from '../../../components/RelativeTime'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {useDateTimeFormat} from '../../../hooks/useDateTimeFormat'
import {Translate, useTranslation} from '../../../i18n'
import {useDocumentPreviewValues} from '../../../tasks/hooks'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {ReleaseDocumentPreview} from '../components/ReleaseDocumentPreview'
import {
  type AddDocumentToReleaseEvent,
  type DiscardDocumentFromReleaseEvent,
  isAddDocumentToReleaseEvent,
  isCreateReleaseEvent,
  isDiscardDocumentFromReleaseEvent,
  isScheduleReleaseEvent,
  type ReleaseEvent,
} from './activity/types'
import {type ReleaseActivity} from './activity/useReleaseActivity'

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
}

// Missing:
// - ReleaseSetTargetDate
//
//   /* <StatusText size={1}>
// set release time to{' '}
// {event.timing === 'future' ? (
//   <em>{format(event.time || 0, `PPpp`)}</em>
// ) : event.timing === 'immediately' ? (
//   <em>immediately</em>
// ) : (
//   <em>never</em>
// )}{' '}
// &middot;{' '}
// <span title={format(event.timestamp, 'yyyy-MM-dd pp')}>
//   {shortTimeSince(event.timestamp)}
// </span>
// </StatusText> */
//

const ReleaseEventDocumentPreview = ({
  event,
  release,
}: {
  release: ReleaseDocument
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
        releaseId={release._id}
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
  const dateString =
    isScheduleReleaseEvent(event) || isCreateReleaseEvent(event) ? event.publishAt : null

  const formattedDate = useMemo(() => {
    if (!dateString) return null
    return dateTimeFormat.format(new Date(dateString))
  }, [dateString, dateTimeFormat])

  if (!formattedDate) return null
  return (
    <span>
      {children} <strong>{formattedDate}</strong>
    </span>
  )
}
const ActivityItem = ({event, release}: {event: ReleaseEvent; release: ReleaseDocument}) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <Card paddingX={1} paddingY={1}>
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
                values={{releaseTitle: release.metadata.title || release.name}}
                i18nKey={ACTIVITY_TEXT_118N[event.type]}
              />{' '}
              &middot; <RelativeTime time={event.timestamp} useTemporalPhrase minimal />
            </StatusText>
          </Flex>
          {isAddDocumentToReleaseEvent(event) || isDiscardDocumentFromReleaseEvent(event) ? (
            <ReleaseEventDocumentPreview event={event} release={release} />
          ) : null}
        </Stack>
      </Flex>
    </Card>
  )
}

interface ReleaseDashboardActivityPanelProps {
  activity: ReleaseActivity
  release: ReleaseDocument
}
export function ReleaseDashboardActivityPanel({
  activity,
  release,
}: ReleaseDashboardActivityPanelProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  return (
    <Stack>
      <Box padding={4}>
        <Text size={1} weight="medium">
          {t('activity.panel.title')}
        </Text>
      </Box>
      {activity.loading && !activity.events.length && (
        <LoadingBlock title={t('activity.panel.loading')} />
      )}
      {/* TODO: Virtualise this list and add scroll parent */}
      <Stack space={1} paddingX={3}>
        {activity.events.map((event) => (
          <ActivityItem key={event.id} event={event} release={release} />
        ))}
      </Stack>
    </Stack>
  )
}
