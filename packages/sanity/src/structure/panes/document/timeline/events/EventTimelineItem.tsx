import {Card, Flex} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {type MouseEvent, useCallback} from 'react'
import {type DocumentGroupEvent} from 'sanity'

import {Event} from './Event'

export interface TimelineItemProps {
  event: DocumentGroupEvent
  isSelected: boolean
  onSelect: (chunk: DocumentGroupEvent) => void
  optionsMenu?: React.ReactNode
}
export function EventTimelineItem({event, isSelected, onSelect, optionsMenu}: TimelineItemProps) {
  const {type} = event

  const isSelectable =
    type !== 'DeleteDocumentVersion' &&
    type !== 'DeleteDocumentGroup' &&
    type !== 'UnpublishDocument' &&
    type !== 'ScheduleDocumentVersion' &&
    type !== 'UnscheduleDocumentVersion'

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      evt.preventDefault()
      evt.stopPropagation()

      if (isSelectable) {
        onSelect(event)
      }
    },
    [onSelect, event, isSelectable],
  )

  return (
    <Flex gap={1}>
      <Card
        as="button"
        onClick={handleClick}
        padding={2}
        pressed={isSelected}
        radius={2}
        data-ui="timelineItem"
        data-testid="timeline-item-button"
        data-chunk-timestamp={event.timestamp}
      >
        <Event event={event} showChangesBy="tooltip" />
      </Card>
      {optionsMenu}
    </Flex>
  )
}
