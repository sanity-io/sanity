import {Badge, BadgeTone, Inline} from '@sanity/ui'
import React from 'react'
import {RenderBadgeCollectionState} from '../../../components'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentBadgeDescription} from 'sanity'
import {Tooltip} from 'sanity/_internal-ui-components'

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
  if (states.length === 0) {
    return null
  }
  return (
    <Inline space={1}>
      {states.map((badge, index) => (
        <Tooltip
          content={badge.title}
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
            style={{whiteSpace: 'nowrap'}}
          >
            {badge.label}
          </Badge>
        </Tooltip>
      ))}
    </Inline>
  )
}

export function DocumentBadges() {
  const {badges, editState} = useDocumentPane()

  if (!editState || !badges) return null

  return (
    <RenderBadgeCollectionState badges={badges} badgeProps={editState as any}>
      {({states}) => <DocumentBadgesInner states={states} />}
    </RenderBadgeCollectionState>
  )
}
