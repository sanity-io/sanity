/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-array-index-key */

import React from 'react'
import SyncIcon from 'part:@sanity/base/sync-icon'
import {useSyncState} from '@sanity/react-hooks'
import Button from 'part:@sanity/components/buttons/default'
import {Chunk, ChunkType} from '@sanity/field/lib/diff'
import {useDocumentHistory} from '../documentHistory'
import TimeAgo from '../../../components/TimeAgo'
import {HistoryIcon, LiveIcon, PublishIcon} from '../../../badges/icons'
import {getTimelineEventIconComponent, formatTimelineEventLabel} from '../timeline/helpers'
import styles from './documentSparkline.css'
import {Badge} from './types'
import {SESSION_BADGE_SIZE, SESSION_BADGE_MARGIN, MAX_SESSIONS} from './constants'
import {DocumentBadges} from './documentBadges'
import {usePrevious} from './hooks'

const SESSION_BADGE_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  transform: 'translate(0, 0, 0)'
}

interface SessionBadge extends Badge {
  type?: 'live' | ChunkType
  style?: React.CSSProperties
}

const SessionBadge = ({icon, title, type, style = {}}: SessionBadge) => {
  const iconComponent =
    type && type !== 'live' ? getTimelineEventIconComponent(type) || <code>{type}</code> : icon
  return (
    <div className={styles.badge} data-type={type} title={title} style={style}>
      <span className={styles.icon}>{React.createElement(icon || iconComponent)}</span>
      <span className={`${styles.icon} ${styles.hoverIcon}`}>
        <HistoryIcon />
      </span>
    </div>
  )
}

interface DocumentSparklineProps {
  badges: Badge[]
  lastUpdated: string | undefined | null
  editState: any
  type: string | undefined
}

export function DocumentSparkline({type, badges, lastUpdated, editState}: DocumentSparklineProps) {
  const [transitionDirection, setTransitionDirection] = React.useState<'in' | 'out' | ''>('')
  const {open: openHistory, historyController, timeline} = useDocumentHistory()
  const showingRevision = historyController.onOlderRevision()
  const syncState = useSyncState(timeline?.publishedId)

  const lastSession = timeline.lastChunk()
  const lastPublish =
    lastSession?.type === 'publish'
      ? lastSession
      : (timeline.findLastPublishedBefore(lastSession) as any)

  const chunks = timeline.mapChunks(chunk => chunk)
  // Make sure we only show draft sessions
  const filteredSessions =
    lastPublish === 'loading'
      ? []
      : chunks.filter(session => session.type === 'editDraft' && session.index > lastPublish?.index)

  const prevSessionsCount = usePrevious(filteredSessions.length)

  React.useEffect(() => {
    if (filteredSessions.length > prevSessionsCount) {
      setTransitionDirection('in')
    }
    if (prevSessionsCount > filteredSessions.length && filteredSessions.length === 0) {
      setTransitionDirection('out')
    }

    const animateTimer = setTimeout(() => {
      setTransitionDirection('')
    }, 800)
    return () => {
      clearTimeout(animateTimer)
    }
  }, [filteredSessions.length, prevSessionsCount])

  // Only show a max number of edit sessions in the sessions button
  const sessionsSliced = filteredSessions.slice(0, MAX_SESSIONS)

  // Give the session container the correct width based on sessions to enable transitions
  const sessionContainerWidth =
    syncState?.isSyncing || sessionsSliced.length === 1
      ? SESSION_BADGE_SIZE
      : sessionsSliced.length * SESSION_BADGE_MARGIN + SESSION_BADGE_SIZE - SESSION_BADGE_MARGIN
  const isLiveDocument = type === 'live'
  const showPublishedBadge = lastPublish && lastPublish !== 'loading' && !isLiveDocument

  return (
    <div className={styles.root} data-disabled={showingRevision}>
      {showPublishedBadge && (
        <div className={styles.primarySessionBadgeContainer}>
          <SessionBadge
            type="publish"
            icon={PublishIcon}
            title={formatTimelineEventLabel('publish')}
          />
          <div className={styles.statusDetails}>
            <div className={styles.label}>Published</div>
            {lastPublish.endTimestamp && <TimeAgo time={lastPublish?.endTimestamp} />}
          </div>
        </div>
      )}

      {isLiveDocument && (
        <div className={styles.primarySessionBadgeContainer}>
          <SessionBadge type="live" title="Live document" icon={LiveIcon} />
          <div className={styles.statusDetails}>
            <div className={styles.label}>Published</div>
            {lastUpdated && <TimeAgo time={lastUpdated} />}
          </div>
        </div>
      )}

      {!isLiveDocument && (
        <Button
          kind="simple"
          padding="small"
          onClick={openHistory}
          type="button"
          disabled={showingRevision}
          className={styles.reviewChangesButton}
          data-syncing={syncState.isSyncing}
          title="Review changes"
          data-transition={filteredSessions.length === 0 ? 'out' : transitionDirection}
        >
          <div className={styles.inner}>
            <div
              className={styles.sessionBadges}
              style={{minWidth: sessionContainerWidth}}
              data-syncing={syncState.isSyncing}
            >
              {sessionsSliced.map((session, i) => {
                const spacing = i * SESSION_BADGE_MARGIN
                const title = formatTimelineEventLabel(session.type) || session.type
                const icon = syncState?.isSyncing ? SyncIcon : undefined
                return (
                  <SessionBadge
                    key={session.index}
                    title={title}
                    type={session.type}
                    icon={icon}
                    style={{
                      ...SESSION_BADGE_STYLE,
                      transform: syncState?.isSyncing
                        ? `translate3d(0, 0, 0)`
                        : `translate3d(${spacing}px, 0, 0)`
                    }}
                  />
                )
              })}
            </div>
            <div className={styles.statusDetails}>
              <div className={styles.label}>Changes</div>
              {lastUpdated && <TimeAgo time={lastUpdated} />}
            </div>
          </div>
        </Button>
      )}
      <DocumentBadges editState={editState} badges={badges} />
    </div>
  )
}
