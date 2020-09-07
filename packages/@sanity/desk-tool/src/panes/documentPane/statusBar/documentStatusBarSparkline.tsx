/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-array-index-key */

import React from 'react'
import Badge from 'part:@sanity/components/badges/default'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'
// import {SyncState} from './syncState' // TODO
import styles from './documentStatusBarSparkline.css'
import {useDocumentHistory} from '../documentHistory'
import {useTimeAgo} from '@sanity/base/hooks'

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
  const {displayed} = useDocumentHistory()
  const timeAgo = displayed?._updatedAt && useTimeAgo(displayed._updatedAt)
  const lastState = states[states.length - 1]
  return (
    <div className={styles.root}>
      <div className={styles.statusBadges} data-disabled={disabled}>
        {states.map((badge, badgeIndex) => {
          const Icon = badge.icon
          return (
            <div
              key={String(badgeIndex)}
              className={styles.badge}
              data-color={badge.color}
              title={badge.title}
            >
              {Icon ? <Icon /> : badge.label}
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
