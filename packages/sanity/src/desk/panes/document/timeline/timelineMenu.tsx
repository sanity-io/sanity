import {SelectIcon} from '@sanity/icons'
import {Button, Placement, Popover, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {format} from 'date-fns'
import {upperFirst} from 'lodash'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'
import {Chunk, TimelineController} from 'sanity'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
  placement?: Placement
}

const Root = styled(Popover)`
  overflow: hidden;
`

export function TimelineMenu({chunk, mode, placement}: TimelineMenuProps) {
  const {setTimelineRange, setTimelineMode, timelineController$, ready} = useDocumentPane()
  const timelineControllerRef = useRef<TimelineController | null>(null)
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)

  // Subscribe to TimelineController changes and store internal state.
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [hasMoreChunks, setHasMoreChunks] = useState(true)
  const [loading, setLoading] = useState(false)
  const [realRevChunk, setRealRevChunk] = useState<Chunk | null>(null)
  const [sinceTime, setSinceTime] = useState<Chunk | null>(null)
  useEffect(() => {
    const subscription = timelineController$.subscribe((controller) => {
      timelineControllerRef.current = controller
      setChunks(controller.timeline.mapChunks((c) => c))
      setHasMoreChunks(!controller.timeline.reachedEarliestEntry)
      setRealRevChunk(controller.realRevChunk)
      setSinceTime(controller.sinceTime)
      setLoading(false)
      controller.setLoadMore(false)
    })
    return () => subscription.unsubscribe()
  }, [timelineController$])

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
      if (timelineControllerRef.current) {
        const [sinceId, revId] = timelineControllerRef.current.findRangeForNewRev(revChunk)
        setTimelineMode('closed')
        setTimelineRange(sinceId, revId)
      }
    },
    [setTimelineMode, setTimelineRange]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      if (timelineControllerRef.current) {
        const [sinceId, revId] = timelineControllerRef.current?.findRangeForNewSince(sinceChunk)
        setTimelineMode('closed')
        setTimelineRange(sinceId, revId)
      }
    },
    [setTimelineMode, setTimelineRange]
  )

  const handleLoadMore = useCallback(() => {
    if (!loading && timelineControllerRef.current) {
      setLoading(true)
      timelineControllerRef.current.setLoadMore(true)
    }
  }, [loading])

  const content = (
    <>
      {mode === 'rev' && (
        <Timeline
          bottomSelection={realRevChunk}
          chunks={chunks}
          hasMoreChunks={hasMoreChunks}
          onSelect={selectRev}
          onLoadMore={handleLoadMore}
          topSelection={realRevChunk}
        />
      )}
      {mode === 'since' && (
        <Timeline
          bottomSelection={sinceTime}
          chunks={chunks}
          hasMoreChunks={hasMoreChunks}
          disabledBeforeSelection
          onSelect={selectSince}
          onLoadMore={handleLoadMore}
          topSelection={realRevChunk}
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
