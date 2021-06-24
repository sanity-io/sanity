/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-array-index-key */

import React from 'react'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'
import DocumentBadge from 'part:@sanity/components/badges/default'
import {Flex, Box} from '@sanity/ui'
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
    <Flex align="center" paddingX={3}>
      {customDocumentBadges.length > 0 &&
        customDocumentBadges.map((badge, index) => (
          <Box key={String(index)}>
            <DocumentBadge color={(badge.color as any) || 'default'} title={badge.title}>
              {badge.label}
            </DocumentBadge>
          </Box>
        ))}
    </Flex>
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
