import {SelectIcon} from '@sanity/icons'
import {useClickOutside, Button, Popover, Placement, useGlobalKeyDown} from '@sanity/ui'
import {format} from 'date-fns'
import {upperFirst} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {sinceTimelineProps, revTimelineProps, formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'
import {Chunk} from 'sanity'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
  placement?: Placement
}

const Root = styled(Popover)`
  & > div {
    display: flex;
    flex-direction: column;

    & > [data-ui='Card'] {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      /* This is the scrollable container rendered by <Timeline /> */
      & > div {
        flex: 1;
        min-height: 0;
      }
    }
  }
`

export function TimelineMenu({chunk, mode, placement}: TimelineMenuProps) {
  const {historyController, setTimelineRange, setTimelineMode, timeline, ready} = useDocumentPane()
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [menuContent, setMenuContent] = useState<HTMLDivElement | null>(null)

  const handleOpen = useCallback(() => {
    setTimelineMode(mode)
    setOpen(true)
  }, [mode, setTimelineMode])

  const handleClose = useCallback(() => {
    setTimelineMode('closed')
    setOpen(false)
  }, [setTimelineMode])

  const handleClickOutside = useCallback(() => {
    handleClose()
  }, [handleClose])

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (open && (event.key === 'Escape' || event.key === 'Tab')) {
        handleClose()
        button?.focus()
      }
    },
    [button, handleClose, open]
  )

  useClickOutside(handleClickOutside, [menuContent, button])
  useGlobalKeyDown(handleGlobalKeyDown)

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewRev(revChunk)
      setTimelineMode('closed')
      setOpen(false)
      setTimelineRange(sinceId, revId)
    },
    [historyController, setTimelineMode, setTimelineRange]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewSince(sinceChunk)
      setTimelineMode('closed')
      setOpen(false)
      setTimelineRange(sinceId, revId)
    },
    [historyController, setTimelineMode, setTimelineRange]
  )

  const loadMoreHistory = useCallback(
    (state: boolean) => {
      historyController.setLoadMore(state)
    },
    [historyController]
  )

  const content = open && (
    <div ref={setMenuContent}>
      {mode === 'rev' ? (
        <Timeline
          onSelect={selectRev}
          onLoadMore={loadMoreHistory}
          timeline={timeline}
          {...revTimelineProps(historyController.realRevChunk)}
        />
      ) : (
        <Timeline
          onSelect={selectSince}
          onLoadMore={loadMoreHistory}
          timeline={timeline}
          {...sinceTimelineProps(historyController.sinceTime!, historyController.realRevChunk)}
        />
      )}
    </div>
  )

  const timeLabel = useFormattedTimestamp(chunk?.endTimestamp || '')

  const revLabel = chunk
    ? `${upperFirst(formatTimelineEventLabel(chunk.type))}: ${timeLabel}`
    : 'Latest version'

  const sinceLabel = chunk ? `Since: ${timeLabel}` : 'Since unknown version'

  const buttonLabel = mode === 'rev' ? revLabel : sinceLabel

  return (
    <Root
      constrainSize
      content={content}
      data-ui="versionMenu"
      open={open}
      placement={placement}
      portal
    >
      <Button
        disabled={!ready}
        mode="bleed"
        fontSize={1}
        padding={2}
        iconRight={SelectIcon}
        onClick={open ? handleClose : handleOpen}
        ref={setButton}
        selected={open}
        text={buttonLabel}
      />
    </Root>
  )
}

export function useFormattedTimestamp(time: string): string {
  const formatted = useMemo(() => {
    const parsedDate = time ? new Date(time) : new Date()
    const formattedDate = format(parsedDate, 'MMM d, yyyy, hh:mm a')
    return formattedDate
  }, [time])

  return formatted
}
