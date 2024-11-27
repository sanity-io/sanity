import {Card, Flex} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {type DocumentGroupEvent, type DocumentVariantType} from 'sanity'

import {Tooltip} from '../../../../../ui-components'
import {Event} from './Event'

export interface TimelineItemProps {
  event: DocumentGroupEvent
  isSelected: boolean
  onSelect: (chunk: DocumentGroupEvent) => void
  optionsMenu?: React.ReactNode
  documentVariantType: DocumentVariantType
}

const getIsSelectable = (event: DocumentGroupEvent, documentVariantType: DocumentVariantType) => {
  if (documentVariantType === 'version' && event.type === 'PublishDocumentVersion') {
    return false
  }
  const {type} = event
  return (
    type !== 'DeleteDocumentVersion' &&
    type !== 'DeleteDocumentGroup' &&
    type !== 'UnpublishDocument' &&
    type !== 'ScheduleDocumentVersion' &&
    type !== 'UnscheduleDocumentVersion'
  )
}

export function EventTimelineItem({
  event,
  isSelected,
  onSelect,
  optionsMenu,
  documentVariantType,
}: TimelineItemProps) {
  const isSelectable = getIsSelectable(event, documentVariantType)

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
    <Tooltip
      content={
        isSelectable
          ? ''
          : // TODO: Confirm this and translate it
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
            'It is not possible to select this event'
      }
      disabled={isSelectable}
    >
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
          <Event event={event} showChangesBy="tooltip" documentVariantType={documentVariantType} />
        </Card>
        {optionsMenu}
      </Flex>
    </Tooltip>
  )
}
