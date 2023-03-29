import {SelectIcon} from '@sanity/icons'
import {Button, Placement, Popover, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {format} from 'date-fns'
import {upperFirst} from 'lodash'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'
import {Chunk} from 'sanity'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
  placement?: Placement
}

const Root = styled(Popover)`
  overflow: hidden;
`

export function TimelineMenu({chunk, mode, placement}: TimelineMenuProps) {
  const {
    setTimelineRange,
    setTimelineMode,
    timelineController,
    timelineState,
    timelineChunks$,
    ready,
  } = useDocumentPane()
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setChunks(timelineState.timeline.mapChunks((c) => c))
    const subscription = timelineChunks$.subscribe((newChunks) => {
      setChunks(newChunks)
      setLoading(false)
      timelineController.setLoadMore(false)
    })

    return () => subscription.unsubscribe()
  }, [timelineController, timelineChunks$, timelineState.timeline])

  const handleOpen = useCallback(() => {
    setTimelineMode(mode)
    setOpen(true)
  }, [mode, setTimelineMode])

  const handleClose = useCallback(() => {
    setTimelineMode('closed')
    setOpen(false)
  }, [setTimelineMode])

  const handleClickOutside = useCallback(() => {
    if (open) {
      handleClose()
    }
  }, [handleClose, open])

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (open && (event.key === 'Escape' || event.key === 'Tab')) {
        handleClose()
        button?.focus()
      }
    },
    [button, handleClose, open]
  )

  useClickOutside(handleClickOutside, [button, popover])
  useGlobalKeyDown(handleGlobalKeyDown)

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      const [sinceId, revId] = timelineController.findRangeForNewRev(revChunk)
      setTimelineMode('closed')
      setTimelineRange(sinceId, revId)
    },
    [timelineController, setTimelineMode, setTimelineRange]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      const [sinceId, revId] = timelineController.findRangeForNewSince(sinceChunk)
      setTimelineMode('closed')
      setTimelineRange(sinceId, revId)
    },
    [timelineController, setTimelineMode, setTimelineRange]
  )

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      setLoading(true)
      timelineController.setLoadMore(true)
    }
  }, [loading, timelineController])

  const content = (
    <>
      {mode === 'rev' && (
        <Timeline
          bottomSelection={timelineState.realRevChunk}
          chunks={chunks}
          onSelect={selectRev}
          onLoadMore={handleLoadMore}
          topSelection={timelineState.realRevChunk}
        />
      )}
      {mode === 'since' && (
        <Timeline
          bottomSelection={timelineState.sinceTime}
          chunks={chunks}
          disabledBeforeSelection
          onSelect={selectSince}
          onLoadMore={handleLoadMore}
          topSelection={timelineState.realRevChunk}
        />
      )}
    </>
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
      content={open && content}
      data-ui="versionMenu"
      open={open}
      placement={placement}
      portal
      ref={setPopover}
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
        text={ready ? buttonLabel : 'Loading history'}
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
