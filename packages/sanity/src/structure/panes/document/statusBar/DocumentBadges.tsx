import {Badge, type BadgeTone, Inline} from '@sanity/ui'
import {memo, useCallback, useDeferredValue} from 'react'
import {type DocumentBadgeDescription} from 'sanity'

import {Tooltip} from '../../../../ui-components'
import {RenderBadgeCollectionState} from '../../../components'
import {useDocumentPane} from '../useDocumentPane'

interface DocumentBadgesInnerProps {
  states: DocumentBadgeDescription[]
}

const BADGE_TONES: Record<string, BadgeTone | undefined> = {
  primary: 'primary',
  success: 'positive',
  warning: 'caution',
  danger: 'critical',
}

const DocumentBadgesInner = memo(function DocumentBadgesInner({states}: DocumentBadgesInnerProps) {
  if (states.length === 0) {
    return null
  }
  return (
    <Inline space={1}>
      {states.map((badge, index) => (
        <Tooltip
          content={badge.title}
          disabled={!badge.title}
          key={`${badge.label}-${index}`}
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
})

const DocumentBadgesDeferred = memo(function DocumentBadgesDeferred(
  props: DocumentBadgesInnerProps,
) {
  /**
   * The purpose of this component is to allow deferring the rendering of document action hook states if the main thread becomes very busy.
   * The `useDeferredValue` doesn't have an effect unless it's used to delay rendering a component that has `React.memo` to prevent unnecessary re-renders.
   */
  const states = useDeferredValue(props.states)
  return <DocumentBadgesInner states={states} />
})

export function DocumentBadges() {
  const {badges, editState} = useDocumentPane()

  const renderDocumentBadges = useCallback<
    (props: {states: DocumentBadgeDescription[]}) => React.ReactNode
  >(({states}) => <DocumentBadgesDeferred states={states} />, [])

  if (!editState || !badges) return null

  return (
    <RenderBadgeCollectionState badges={badges} badgeProps={editState}>
      {renderDocumentBadges}
    </RenderBadgeCollectionState>
  )
}
