import {BoundaryElementProvider, Card} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
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

import {
  HoverPopover,
  type HoverPopoverProps,
} from '../../../../../ui-components/hoverPopover/HoverPopover'
import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useDocumentPane} from '../../useDocumentPane'
import {ChangedFieldTitles} from './ChangedFieldTitles'
import {ChangesErrorBoundary} from './ChangesErrorBoundary'
import {EditEventChanges} from './EditEventChanges'
import {getEditEventRange, useEditEventChanges} from './useEditEventChanges'

export interface TimelineItemProps {
  event: DocumentGroupEvent
  isSelected: boolean
  onSelect: (chunk: DocumentGroupEvent) => void
  optionsMenu?: React.ReactNode
}

// The timeline sits at the right edge of the pane, so the changes show next to it, over the form.
// They wait a bit longer than tooltips before opening while the pointer moves along the list,
// and only the changes of one edit are open at a time, in any timeline.
const CHANGES_POPOVER_PROPS = {
  openDelay: 600,
  placement: 'left',
  fallbackPlacements: ['left-start', 'left-end', 'right', 'bottom'],
  group: 'edit-changes',
  portal: true,
} satisfies Partial<HoverPopoverProps>

/** The titles of the fields an edit changed, once they are loaded. */
function EditEventChangedFields({event}: {event: EditDocumentVersionEvent}) {
  const {schemaType} = useDocumentPane()
  const {diff} = useEditEventChanges(event)
  return diff && <ChangedFieldTitles diff={diff} schemaType={schemaType} />
}

/** An edit event, with the titles of the fields it changed when they can be shown. */
function EditEvent({event}: {event: EditDocumentVersionEvent}) {
  const {fromRevisionId, toRevisionId} = getEditEventRange(event)
  return (
    <Event
      event={event}
      changedFields={
        <ChangesErrorBoundary key={`${fromRevisionId}:${toRevisionId}`} fallback={null}>
          <EditEventChangedFields event={event} />
        </ChangesErrorBoundary>
      }
      // The row's avatars are already the edit's contributors.
      showChangesBy="hidden"
    />
  )
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
        minWidth: 0,
      }}
    >
      {isEditDocumentVersionEvent(event) ? (
        <EditEvent event={event} />
      ) : (
        <Event event={event} showChangesBy="tooltip" />
      )}
    </Card>
  )

  return (
    <Flex gap={1}>
      {isEditDocumentVersionEvent(event) ? (
        // The timeline's scroller is the boundary otherwise, which leaves no room on the left.
        <BoundaryElementProvider element={null}>
          <HoverPopover
            {...CHANGES_POPOVER_PROPS}
            content={
              <Box padding={3} style={{width: 360, maxHeight: '50vh', overflowY: 'auto'}}>
                <EditEventChanges event={event} />
              </Box>
            }
          >
            {card}
          </HoverPopover>
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
