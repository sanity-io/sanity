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
import {type DocumentGroupEvent, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, Popover} from '../../../../../ui-components'
import {useEvents} from '../../HistoryProvider'
import {useDocumentPane} from '../../useDocumentPane'
import {TimelineError} from '../TimelineError'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from './constants'
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
  const {setTimelineRange, timelineError} = useDocumentPane()
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popoverRef, setPopoverRef] = useState<HTMLElement | null>(null)
  const toast = useToast()
  const {nextCursor, loading, findRangeForRevision, findRangeForSince, loadMoreEvents} = useEvents()

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
          revEvent.type === 'DeleteDocumentVersion' ||
          revEvent.type === 'DeleteDocumentGroup' ||
          revEvent.type === 'UnpublishDocument' ||
          revEvent.type === 'ScheduleDocumentVersion' ||
          revEvent.type == 'UnscheduleDocumentVersion'
        ) {
          console.error('Event is not selectable')
          return
        }
        // ('versionRevisionId' in revEvent && revEvent.versionRevisionId) || revEvent.revisionId,
        const [since, rev] = findRangeForRevision(revEvent?.id)
        console.log('selectRev', {since, rev})
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
        // ('versionRevisionId' in sinceEvent && sinceEvent.versionRevisionId) || sinceEvent.revisionId,
        const [since, rev] = findRangeForSince(sinceEvent.id)
        console.log('selectSince', {since, rev})

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
    if (timelineError) return <TimelineError />

    if (mode === 'rev') {
      return (
        <EventsTimeline
          events={events}
          hasMoreEvents={Boolean(nextCursor)}
          selectedEventId={event?.id}
          onLoadMore={handleLoadMore}
          onSelect={selectRev}
        />
      )
    }

    return (
      <EventsTimeline
        events={events}
        hasMoreEvents={Boolean(nextCursor)}
        selectedEventId={event?.id}
        onLoadMore={handleLoadMore}
        onSelect={selectSince}
      />
    )
  }, [event?.id, events, handleLoadMore, mode, nextCursor, selectRev, selectSince, timelineError])

  const revLabel = event
    ? t(TIMELINE_ITEM_I18N_KEY_MAPPING[event.type], {
        context: 'timestamp',
        timestamp: new Date(event.timestamp),
        formatParams,
      })
    : t('timeline.latest-revision')

  const sinceLabel = event
    ? t(TIMELINE_ITEM_I18N_KEY_MAPPING[event.type], {
        context: 'timestamp',
        timestamp: new Date(event.timestamp),
        formatParams,
      })
    : t('timeline.since-version-missing')

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
            disabled={loading}
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
