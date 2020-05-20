/* eslint-disable react/no-multi-comp */
import {useEditState} from '@sanity/react-hooks'
import React from 'react'
import Badge from 'part:@sanity/components/badges/default'

import styles from './DocumentStatusBarBadges.css'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'

export interface Badge {
  label: string
  title: string
  color: 'success' | 'failure' | 'warning'
}

interface Props {
  states: Badge[]
}

function DocumentStatusBarBadgesInner(props: Props) {
  if (props.states.length === 0) {
    return null
  }
  return (
    <div className={styles.statusBadges}>
      {props.states.map((badge, badgeIndex) => (
        <div key={String(badgeIndex)}>
          <Badge color={badge.color} title={badge.title}>
            {badge.label}
          </Badge>
        </div>
      ))}
    </div>
  )
}

export function DocumentStatusBarBadges(props: {id: string; type: string}) {
  const editState = useEditState(props.id, props.type)

  const badges = editState ? resolveDocumentBadges(editState) : null

  return badges ? (
    <RenderBadgeCollectionState
      component={DocumentStatusBarBadgesInner}
      badges={badges}
      badgeProps={editState}
    />
  ) : null
}
