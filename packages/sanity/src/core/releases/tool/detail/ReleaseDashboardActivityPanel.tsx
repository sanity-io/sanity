import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {RelativeTime} from '../../../components/RelativeTime'
import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {Resizable} from '../../../form/studio/tree-editing/components/layout/resizer'
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
  isEditReleaseEvent,
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
  releaseEditEvent: 'activity.event.edit',
}

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
const ActivityItem = ({event, release}: {event: ReleaseEvent; release: ReleaseDocument}) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <FadeInCard
      paddingX={1}
      paddingY={1}
      overflow="hidden"
      // This card animates on entrance when a new event is added, not for every event that is rendered.
      // So if the user is seeing the list and a new event lands, the list will animate the new event. (That is by the <AnimatePresence initial=false> component wrapping the list)
      initial={{height: 0, opacity: 0}}
      animate={{height: 'auto', opacity: 1}}
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
    </FadeInCard>
  )
}

interface ReleaseDashboardActivityPanelProps {
  activity: ReleaseActivity
  release: ReleaseDocument
  show: boolean
}
const MotionFlex = motion(Flex)
const FillHeight = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`
export function ReleaseDashboardActivityPanel({
  activity,
  release,
  show,
}: ReleaseDashboardActivityPanelProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  return (
    <AnimatePresence>
      {show && (
        <>
          <Card flex="none" borderLeft marginY={2} style={{opacity: 0.6}} />
          <motion.div
            animate={{width: 'auto', opacity: 1}}
            initial={{width: 0, opacity: 0}}
            exit={{width: 0, opacity: 0}}
            transition={{type: 'spring', bounce: 0, duration: 0.2}}
          >
            <Resizable
              as={FillHeight}
              minWidth={320}
              maxWidth={800}
              initialWidth={320}
              resizerPosition="left"
              style={{display: 'flex', flexDirection: 'column', flex: 'none', maxHeight: '100%'}}
            >
              <MotionFlex flex="none" height="fill" direction="column">
                <Box padding={4}>
                  <Text size={1} weight="medium">
                    {t('activity.panel.title')}
                  </Text>
                </Box>
                {activity.loading && !activity.events.length && (
                  <LoadingBlock title={t('activity.panel.loading')} />
                )}
                {/* TODO: Virtualise this list and add scroll parent */}
                <Stack space={1} paddingX={3} height="fill" style={{overflow: 'scroll'}}>
                  <AnimatePresence initial={false}>
                    {activity.events.map((event) => (
                      <ActivityItem key={event.id} event={event} release={release} />
                    ))}
                  </AnimatePresence>
                  <Box paddingBottom={4} />
                </Stack>
              </MotionFlex>
            </Resizable>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
