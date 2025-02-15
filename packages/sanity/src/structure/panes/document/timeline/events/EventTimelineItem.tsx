import {Card, Flex} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {
  type DocumentGroupEvent,
  Event,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  useTranslation,
} from 'sanity'

import {Tooltip} from '../../../../../ui-components'

export interface TimelineItemProps {
  event: DocumentGroupEvent
  isSelected: boolean
  onSelect: (chunk: DocumentGroupEvent) => void
  optionsMenu?: React.ReactNode
}

const getIsSelectable = (event: DocumentGroupEvent) => {
  return (
    !isDeleteDocumentVersionEvent(event) &&
    !isDeleteDocumentGroupEvent(event) &&
    !isUnpublishDocumentEvent(event) &&
    !isScheduleDocumentVersionEvent(event) &&
    !isUnscheduleDocumentVersionEvent(event)
  )
}

export function EventTimelineItem({event, isSelected, onSelect, optionsMenu}: TimelineItemProps) {
  const {t} = useTranslation('studio')
  const isSelectable = getIsSelectable(event)
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
    <Tooltip content={isSelectable ? '' : t('changes.not-selectable')} disabled={isSelectable}>
      <Flex gap={1}>
        <Card
          as={isSelectable ? 'button' : 'div'}
          onClick={handleClick}
          padding={2}
          pressed={isSelected}
          radius={2}
          data-ui="timelineItem"
          data-testid="timeline-item-button"
          data-chunk-timestamp={event.timestamp}
          style={{
            cursor: isSelectable ? 'pointer' : 'default',
          }}
        >
          <Event event={event} showChangesBy="tooltip" />
        </Card>
        {optionsMenu}
      </Flex>
    </Tooltip>
  )
}
