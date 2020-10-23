/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-array-index-key */

import React from 'react'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'
import DocumentBadge from 'part:@sanity/components/badges/default'
import styles from './documentBadges.css'
import {Badge} from './types'

interface Props {
  states: Badge[]
}

function DocumentBadgesInner({states}: Props) {
  // TODO: filter out higher up
  const customDocumentBadges = states.filter(
    (badge) => badge.label && !['Published', 'Draft', 'Live document'].includes(badge.label)
  )
  return (
    <div className={styles.root}>
      {customDocumentBadges.length > 0 && (
        <div className={styles.customDocumentBadges}>
          {customDocumentBadges.map((badge, index) => (
            <div className={styles.documentBadge} key={String(index)}>
              <DocumentBadge color={(badge.color as any) || 'default'} title={badge.title}>
                {badge.label}
              </DocumentBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DocumentBadges(props: {badges: Badge[]; editState: any}) {
  return props.badges ? (
    <RenderBadgeCollectionState
      component={DocumentBadgesInner}
      badges={props.badges}
      badgeProps={props.editState}
    />
  ) : null
}
