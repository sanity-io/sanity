import {DocumentBadgeDescription} from '@sanity/base'
import {EditStateFor} from '@sanity/base/lib/datastores/document/document-pair/editState'
import {Badge, BadgeTone, Box, Inline, Text, Tooltip} from '@sanity/ui'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'
import React from 'react'

export interface DocumentBadgesProps {
  badges: DocumentBadgeDescription[]
  editState: EditStateFor | null
}

interface DocumentBadgesInnerProps {
  states: DocumentBadgeDescription[]
}

const BADGE_TONES: Record<string, BadgeTone | undefined> = {
  primary: 'primary',
  success: 'positive',
  warning: 'caution',
  danger: 'critical',
}

function DocumentBadgesInner({states}: DocumentBadgesInnerProps) {
  return (
    <Inline paddingX={3} space={1}>
      {states.map((badge, index) => (
        <Tooltip
          content={
            badge.title && (
              <Box padding={2}>
                <Text muted size={1}>
                  {badge.title}
                </Text>
              </Box>
            )
          }
          disabled={!badge.title}
          key={String(index)}
          placement="top"
          portal
        >
          <Badge
            fontSize={1}
            mode="outline"
            paddingX={2}
            paddingY={1}
            radius={4}
            tone={badge.color ? BADGE_TONES[badge.color] : undefined}
          >
            {badge.label}
          </Badge>
        </Tooltip>
      ))}
    </Inline>
  )
}

export function DocumentBadges(props: DocumentBadgesProps) {
  const {badges, editState} = props

  if (!badges) return null

  return (
    <RenderBadgeCollectionState
      component={DocumentBadgesInner}
      badges={badges}
      badgeProps={editState}
    />
  )
}
