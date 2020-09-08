/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-array-index-key */

import React from 'react'
import Badge from 'part:@sanity/components/badges/default'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'
import styles from './documentStatusBarSparkline.css'
import {useDocumentHistory} from '../documentHistory'
import {useTimeAgo} from '@sanity/base/hooks'
import SyncIcon from 'part:@sanity/base/sync-icon'
import {useSyncState} from '@sanity/react-hooks'

export interface Badge {
  label: string
  title: string
  color: 'success' | 'failure' | 'warning'
  icon?: any
}

interface Props {
  states: Badge[]
  disabled: boolean
}

function DocumentStatusBarSparklineInner({states, disabled}: Props) {
  if (states.length === 0) {
    return null
  }
  const {displayed, timeline} = useDocumentHistory()
  const timeAgo = displayed?._updatedAt && useTimeAgo(displayed._updatedAt)
  const lastState = states[states.length - 1]
  const syncState = timeline && useSyncState(timeline.publishedId)
  return (
    <div className={styles.root}>
      <div className={styles.statusBadges} data-disabled={disabled}>
        {states.map((badge, badgeIndex, arr) => {
          const showSyncIndicator = badgeIndex === arr.length - 1 && syncState.isSyncing
          const Icon = showSyncIndicator ? SyncIcon : badge.icon
          return (
            <div
              key={String(badgeIndex)}
              className={styles.badge}
              data-color={badge.color}
              title={badge.title}
            >
              {Icon ? (
                <span className={`${styles.icon} ${showSyncIndicator ? styles.isSyncing : ''}`}>
                  <Icon />
                </span>
              ) : (
                badge.label
              )}
            </div>
          )
        })}
        <div className={styles.sparkline} />
      </div>
      <div className={styles.statusDetails}>
        <div className={styles.label}>{lastState.label}</div>
        <div>{timeAgo ? timeAgo : 'Empty'}</div>
      </div>
    </div>
  )
}

export function DocumentStatusBarSparkline(props: {
  badges: Badge[]
  editState: any
  disabled: boolean
}) {
  return props.badges ? (
    <RenderBadgeCollectionState
      component={DocumentStatusBarSparklineInner}
      badges={props.badges}
      badgeProps={props.editState}
      disabled={props.disabled}
    />
  ) : null
}
