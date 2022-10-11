import {Badge, BadgeTone, Box, Inline, Text, Tooltip} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentBadgeDescription, GetHookCollectionState} from 'sanity'

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
    <Inline space={1}>
      {states.map((badge, index) => (
        <Tooltip
          content={
            badge.title && (
              <Box padding={2}>
                <Text size={1}>{badge.title}</Text>
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
  const render = useCallback<(props: {states: DocumentBadgeDescription[]}) => React.ReactNode>(
    ({states}) => <DocumentBadgesInner states={states} />,
    []
  )

  if (!editState || !badges) return null

  return <GetHookCollectionState args={editState} render={render} hooks={badges} />
}
