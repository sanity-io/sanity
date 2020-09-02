/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-array-index-key */

import React from 'react'
import Badge from 'part:@sanity/components/badges/default'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'

import styles from './documentStatusBarBadges.css'

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

function DocumentStatusBarBadgesInner(props: Props) {
  if (props.states.length === 0) {
    return null
  }
  return (
    <div className={styles.statusBadges} data-disabled={props.disabled}>
      {props.states.map((badge, badgeIndex) => {
        const Icon = badge.icon
        return (
          <div
            key={String(badgeIndex)}
            className={styles.badge}
            data-color={badge.color}
            title={badge.title}
          >
            {Icon ? <Icon /> : badge.label}
            {/* <Badge color={badge.color} title={badge.title}>
            </Badge> */}
          </div>
        )
      })}
      <div className={styles.sparkline} />
    </div>
  )
}

export function DocumentStatusBarBadges(props: {
  badges: Badge[]
  editState: any
  disabled: boolean
}) {
  return props.badges ? (
    <RenderBadgeCollectionState
      component={DocumentStatusBarBadgesInner}
      badges={props.badges}
      badgeProps={props.editState}
      disabled={props.disabled}
    />
  ) : null
}
