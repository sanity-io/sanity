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
import {type Chunk, useTimelineSelector, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, Popover} from '../../../../ui-components'
import {useDocumentPane} from '../useDocumentPane'
import {Timeline} from './timeline'
import {TimelineError} from './TimelineError'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from './timelineI18n'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
  placement?: Placement
}

const Root = styled(Popover)`
  overflow: hidden;
  overflow: clip;
`

export const TIMELINE_MENU_PORTAL = 'timeline-menu'

export function TimelineMenu({chunk, mode, placement}: TimelineMenuProps) {
  const {setTimelineRange, timelineError, ready, timelineStore} = useDocumentPane()
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popoverRef, setPopoverRef] = useState<HTMLElement | null>(null)

  const toast = useToast()

  const chunks = useTimelineSelector(timelineStore, (state) => state.chunks)
  const loading = useTimelineSelector(timelineStore, (state) => state.isLoading)
  const hasMoreChunks = useTimelineSelector(timelineStore, (state) => state.hasMoreChunks)
  const realRevChunk = useTimelineSelector(timelineStore, (state) => state.realRevChunk)
  const sinceTime = useTimelineSelector(timelineStore, (state) => state.sinceTime)

  const {t} = useTranslation('studio')

  const handleOpen = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (open && (event.key === 'Escape' || event.key === 'Tab')) {
        handleClose()
        button?.focus()
      }
    },
    [button, handleClose, open],
  )

  useGlobalKeyDown(handleGlobalKeyDown)
  useClickOutsideEvent(open && handleClose, () => [button, popoverRef])

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      try {
        const [sinceId, revId] = timelineStore?.findRangeForRev(revChunk) || [null, null]
        setTimelineRange(sinceId, revId)
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: t('timeline.error.unable-to-load-revision'),
        })
      }
    },
    [setTimelineRange, t, timelineStore, toast],
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      try {
        const [sinceId, revId] = timelineStore?.findRangeForSince(sinceChunk) || [null, null]
        setTimelineRange(sinceId, revId)
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: t('timeline.error.unable-to-load-revision'),
        })
      }
    },
    [setTimelineRange, t, timelineStore, toast],
  )

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      timelineStore?.loadMore()
    }
  }, [loading, timelineStore])

  const content = useMemo(() => {
    if (timelineError) return <TimelineError />

    if (mode === 'rev') {
      return (
        <Timeline
          chunks={chunks}
          hasMoreChunks={hasMoreChunks}
          lastChunk={realRevChunk}
          onLoadMore={handleLoadMore}
          onSelect={selectRev}
        />
      )
    }

    const filteredChunks = realRevChunk
      ? chunks.filter((c) => c.index < realRevChunk.index)
      : chunks
    return (
      <Timeline
        chunks={filteredChunks}
        hasMoreChunks={hasMoreChunks}
        lastChunk={sinceTime}
        onLoadMore={handleLoadMore}
        onSelect={selectSince}
      />
    )
  }, [
    chunks,
    handleLoadMore,
    hasMoreChunks,
    mode,
    realRevChunk,
    selectRev,
    selectSince,
    sinceTime,
    timelineError,
  ])

  const formatParams = {
    timestamp: {dateStyle: 'medium', timeStyle: 'short'},
  }

  const revLabel = chunk
    ? t(TIMELINE_ITEM_I18N_KEY_MAPPING[chunk.type], {
        context: 'timestamp',
        timestamp: new Date(chunk?.endTimestamp),
        formatParams,
      })
    : t('timeline.latest-revision')

  const sinceLabel = chunk
    ? t('timeline.since', {
        timestamp: new Date(chunk?.endTimestamp),
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
            disabled={!ready}
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
            text={ready ? buttonLabel : t('timeline.loading-history')}
          />
        </Flex>
      </Root>
    </PortalProvider>
  )
}
