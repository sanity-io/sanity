import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Flex,
  Skeleton,
  Text,
} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {useEffect, useLayoutEffect, useMemo, useState} from 'react'
import {
  AvatarSkeleton,
  isPublishedPerspective,
  TIMELINE_ITEM_I18N_KEY_MAPPING,
  useEvents,
  usePerspective,
  UserAvatar,
  useRelativeTime,
  useSource,
  useSyncState,
  useTimelineSelector,
  useTranslation,
} from 'sanity'

import {HISTORY_INSPECTOR_NAME} from '../constants'
import {TIMELINE_ITEM_I18N_KEY_MAPPING as TIMELINE_ITEM_I18N_KEY_MAPPING_LEGACY} from '../timeline'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusPulse} from './DocumentStatusPulse'

const RELATIVE_TIME_OPTIONS = {
  minimal: true,
  useTemporalPhrase: true,
} as const

const MotionButton = motion.create(Button)
const MotionBox = motion.create(Box)

const ButtonSkeleton = () => {
  return (
    <Flex align="center" gap={3} paddingLeft={1} paddingRight={2} paddingY={2}>
      <div style={{margin: -5}}>
        <AvatarSkeleton $size={0} animated />
      </div>
      <Skeleton animated style={{width: '80px', height: '15px'}} radius={2} />
    </Flex>
  )
}

const DocumentStatusButton = ({
  author,
  translationKey,
  timestamp = '',
}: {
  author: string
  translationKey: string
  timestamp?: string
}) => {
  const {onHistoryOpen, inspector, onHistoryClose} = useDocumentPane()
  const {t} = useTranslation()
  const relativeTime = useRelativeTime(timestamp, RELATIVE_TIME_OPTIONS)

  return (
    <MotionButton
      data-testid="pane-footer-document-status"
      animate={{opacity: 1}}
      initial={{opacity: 0}}
      exit={{opacity: 0}}
      mode="bleed"
      onClick={inspector?.name === HISTORY_INSPECTOR_NAME ? onHistoryClose : onHistoryOpen}
      padding={2}
      muted
    >
      <Flex align="center" flex="none" gap={3}>
        {author && (
          <div style={{margin: -5}}>
            <UserAvatar user={author} size={0} />
          </div>
        )}
        <Text muted size={1}>
          {t(translationKey)} {relativeTime}
        </Text>
      </Flex>
    </MotionButton>
  )
}

const FallbackStatus = () => {
  const {editState} = useDocumentPane()
  const {selectedPerspective} = usePerspective()

  const status = useMemo(() => {
    if (isPublishedPerspective(selectedPerspective) && editState?.published?._updatedAt) {
      return {
        translationKey: TIMELINE_ITEM_I18N_KEY_MAPPING.createDocumentVersion,
        timestamp: editState.published._updatedAt,
      }
    }
    if (editState?.version?._updatedAt) {
      return {
        translationKey:
          editState?.version?._updatedAt === editState?.version?._createdAt
            ? TIMELINE_ITEM_I18N_KEY_MAPPING.createDocumentVersion
            : TIMELINE_ITEM_I18N_KEY_MAPPING.editDocumentVersion,
        timestamp: editState.version._updatedAt,
      }
    }
    if (editState?.draft?._updatedAt) {
      return {
        translationKey:
          editState?.draft?._updatedAt === editState?.draft?._createdAt
            ? TIMELINE_ITEM_I18N_KEY_MAPPING.createDocumentVersion
            : TIMELINE_ITEM_I18N_KEY_MAPPING.editDocumentVersion,
        timestamp: editState.draft._updatedAt,
      }
    }
    return null
  }, [
    selectedPerspective,
    editState?.published?._updatedAt,
    editState?.version?._updatedAt,
    editState?.version?._createdAt,
    editState?.draft?._updatedAt,
    editState?.draft?._createdAt,
  ])
  if (!status) {
    return null
  }
  return (
    <DocumentStatusButton
      author=""
      translationKey={status.translationKey}
      timestamp={status.timestamp}
    />
  )
}

const EventsStatus = () => {
  const {events, loading} = useEvents()
  const event = events?.[0]

  if (!event && loading) {
    return <ButtonSkeleton />
  }
  if (!event) {
    return <FallbackStatus />
  }

  return (
    <DocumentStatusButton
      author={event.author}
      translationKey={TIMELINE_ITEM_I18N_KEY_MAPPING[event.type]}
      timestamp={event.timestamp}
    />
  )
}

const TimelineStatus = () => {
  const {timelineStore} = useDocumentPane()
  const chunks = useTimelineSelector(timelineStore, (state) => state.chunks)
  const loading = useTimelineSelector(timelineStore, (state) => state.isLoading)
  const event = chunks?.[0]

  if (!event && loading) {
    return <ButtonSkeleton />
  }
  if (!event) {
    return <FallbackStatus />
  }

  const author = Array.from(event.authors)[0]
  return (
    <DocumentStatusButton
      author={author}
      translationKey={TIMELINE_ITEM_I18N_KEY_MAPPING_LEGACY[event.type]}
      timestamp={event.endTimestamp}
    />
  )
}

const SYNCING_TIMEOUT = 1000
const SAVED_TIMEOUT = 3000

export function DocumentStatusLine() {
  const {documentId, documentType, editState, value} = useDocumentPane()
  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)
  const source = useSource()
  const eventsEnabled = source.beta?.eventsAPI?.documents

  const syncState = useSyncState(documentId, documentType, editState?.release)

  const lastUpdated = value?._updatedAt

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    // Schedule an update to set the status to 'saved' when status changed to 'syncing.
    // We use `syncState.isSyncing` here to avoid the status being set to 'saved' when the document is syncing.
    if (status === 'syncing' && !syncState.isSyncing) {
      const timerId = setTimeout(() => setStatus('saved'), SYNCING_TIMEOUT)
      return () => clearTimeout(timerId)
    }
    // Schedule an update to clear the status when status changed to 'saved'
    if (status === 'saved') {
      const timerId = setTimeout(() => setStatus(null), SAVED_TIMEOUT)
      return () => clearTimeout(timerId)
    }
  }, [status, lastUpdated, syncState.isSyncing])

  // Clear the status when documentId changes to make sure we don't show the wrong status when opening a new document
  useLayoutEffect(() => {
    setStatus(null)
  }, [documentId])

  // Set status to 'syncing' when lastUpdated changes and we go from not syncing to syncing
  useLayoutEffect(() => {
    if (syncState.isSyncing) {
      setStatus('syncing')
    }
  }, [syncState.isSyncing, lastUpdated])

  return (
    <AnimatePresence>
      {status ? (
        <MotionBox
          paddingLeft={2}
          animate={{opacity: 1}}
          initial={{opacity: 0}}
          exit={{opacity: 0}}
        >
          <DocumentStatusPulse status={status || undefined} />
        </MotionBox>
      ) : (
        <>{eventsEnabled ? <EventsStatus /> : <TimelineStatus />}</>
      )}
    </AnimatePresence>
  )
}
