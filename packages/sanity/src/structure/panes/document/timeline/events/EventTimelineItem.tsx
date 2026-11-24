import {BoundaryElementProvider, Card} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {
  type DocumentGroupEvent,
  Event,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  useTranslation,
} from 'sanity'
import {Box, Flex} from 'ui5'

import {Tooltip, type TooltipProps} from '../../../../../ui-components/tooltip/Tooltip'
import {EditEventChanges} from './EditEventChanges'
import {isEditTransactionEvent} from './timelineRows'

export interface TimelineItemProps {
  event: DocumentGroupEvent
  isSelected: boolean
  onSelect: (chunk: DocumentGroupEvent) => void
  optionsMenu?: React.ReactNode
}

// The timeline sits at the right edge of the pane, so the changes show next to it, over the form.
// They are fetched when shown, so they wait a bit longer than other tooltips while the pointer
// moves along the list.
const CHANGES_TOOLTIP_PROPS: Partial<TooltipProps> = {
  delay: {open: 600},
  placement: 'left',
  fallbackPlacements: ['left-start', 'left-end', 'right', 'bottom'],
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
  const card = (
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
        width: '100%',
      }}
    >
      {/* A transaction has a single author, already shown as the row avatar. */}
      <Event event={event} showChangesBy={isEditTransactionEvent(event) ? 'hidden' : 'tooltip'} />
    </Card>
  )

  return (
    <Flex gap={1}>
      {isEditDocumentVersionEvent(event) ? (
        // The timeline's scroller is the boundary otherwise, which leaves no room on the left.
        <BoundaryElementProvider element={null}>
          <Tooltip
            {...CHANGES_TOOLTIP_PROPS}
            content={
              <Box padding={3} style={{width: 360, maxHeight: '50vh', overflow: 'hidden'}}>
                <EditEventChanges event={event} />
              </Box>
            }
          >
            {card}
          </Tooltip>
        </BoundaryElementProvider>
      ) : (
        <Tooltip content={isSelectable ? '' : t('changes.not-selectable')} disabled={isSelectable}>
          {card}
        </Tooltip>
      )}
      {optionsMenu}
    </Flex>
  )
}
