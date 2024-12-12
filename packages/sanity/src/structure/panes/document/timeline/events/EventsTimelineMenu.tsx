import {ChevronDownIcon} from '@sanity/icons'
import {
  Flex,
  type Placement,
  PortalProvider,
  useClickOutsideEvent,
  useGlobalKeyDown,
  useToast,
} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentGroupEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  TIMELINE_ITEM_I18N_KEY_MAPPING,
  useEvents,
  useTranslation,
} from 'sanity'
import {styled} from 'styled-components'

import {Button, Popover} from '../../../../../ui-components'
import {useDocumentPane} from '../../useDocumentPane'
import {TimelineError} from '../TimelineError'
import {EventsTimeline} from './EventsTimeline'

interface TimelineMenuProps {
  event: DocumentGroupEvent | null
  events: DocumentGroupEvent[]
  mode: 'rev' | 'since'
  placement?: Placement
}

const Root = styled(Popover)`
  overflow: hidden;
  overflow: clip;
`

export const TIMELINE_MENU_PORTAL = 'timeline-menu'

const formatParams = {
  timestamp: {dateStyle: 'medium', timeStyle: 'short'},
}

export function EventsTimelineMenu({event, events, mode, placement}: TimelineMenuProps) {
  const {setTimelineRange} = useDocumentPane()
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popoverRef, setPopoverRef] = useState<HTMLElement | null>(null)
  const toast = useToast()
  const {
    nextCursor,
    loading,
    error: eventsError,
    findRangeForRevision,
    findRangeForSince,
    loadMoreEvents,
    expandEvent,
  } = useEvents()

  const {t} = useTranslation('studio')

  const handleOpen = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (open && (e.key === 'Escape' || e.key === 'Tab')) {
        handleClose()
        button?.focus()
      }
    },
    [button, handleClose, open],
  )

  useGlobalKeyDown(handleGlobalKeyDown)
  useClickOutsideEvent(open && handleClose, () => [button, popoverRef])

  const selectRev = useCallback(
    (revEvent: DocumentGroupEvent) => {
      try {
        if (
          isDeleteDocumentVersionEvent(revEvent) ||
          isDeleteDocumentGroupEvent(revEvent) ||
          isUnpublishDocumentEvent(revEvent) ||
          isScheduleDocumentVersionEvent(revEvent) ||
          isUnscheduleDocumentVersionEvent(revEvent)
        ) {
          console.error('Event is not selectable')
          return
        }
        const [since, rev] = findRangeForRevision(revEvent?.id)
        setTimelineRange(since, rev)
        handleClose()
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: t('timeline.error.unable-to-load-revision'),
        })
      }
    },
    [t, toast, setTimelineRange, findRangeForRevision, handleClose],
  )

  const selectSince = useCallback(
    (sinceEvent: DocumentGroupEvent) => {
      try {
        const [since, rev] = findRangeForSince(sinceEvent.id)
        setTimelineRange(since, rev)
        handleClose()
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: t('timeline.error.unable-to-load-revision'),
        })
      }
    },
    [findRangeForSince, setTimelineRange, toast, t, handleClose],
  )

  const handleLoadMore = useCallback(() => {
    if (!loading && nextCursor) {
      loadMoreEvents()
    }
  }, [loading, loadMoreEvents, nextCursor])

  const content = useMemo(() => {
    if (eventsError) return <TimelineError />

    return (
      <EventsTimeline
        events={events}
        fetchEventChildren={expandEvent}
        hasMoreEvents={Boolean(nextCursor)}
        selectedEventId={event?.id}
        onLoadMore={handleLoadMore}
        onSelect={mode === 'rev' ? selectRev : selectSince}
      />
    )
  }, [
    eventsError,
    mode,
    expandEvent,
    events,
    nextCursor,
    event?.id,
    handleLoadMore,
    selectSince,
    selectRev,
  ])

  const revLabel = event
    ? t(TIMELINE_ITEM_I18N_KEY_MAPPING[event.type], {
        context: 'timestamp',
        timestamp: new Date(event.timestamp),
        formatParams,
      })
    : t('timeline.latest-revision')

  // eslint-disable-next-line no-nested-ternary
  const sinceLabel = event
    ? t(TIMELINE_ITEM_I18N_KEY_MAPPING[event.type], {
        context: 'timestamp',
        timestamp: new Date(event.timestamp),
        formatParams,
      })
    : events.length > 0
      ? t('timeline.since-version-missing')
      : t('timeline.no-previous-events')

  const buttonLabel = mode === 'rev' ? revLabel : sinceLabel

  return (
    <PortalProvider __unstable_elements={{[TIMELINE_MENU_PORTAL]: popoverRef}}>
      <Root
        data-testid="timeline-menu"
        constrainSize
        content={open && content}
        data-ui="versionMenu"
        open={open}
        placement={placement}
        matchReferenceWidth
        portal
        ref={setPopoverRef}
      >
        <Flex width={'fill'}>
          <Button
            data-testid={open ? 'timeline-menu-close-button' : 'timeline-menu-open-button'}
            disabled={loading || !events.length}
            mode="ghost"
            onClick={open ? handleClose : handleOpen}
            ref={setButton}
            selected={open}
            width="fill"
            tooltipProps={null}
            justify={'space-between'}
            style={{
              maxWidth: '100%',
            }}
            iconRight={ChevronDownIcon}
            text={loading ? t('timeline.loading-history') : buttonLabel}
          />
        </Flex>
      </Root>
    </PortalProvider>
  )
}
