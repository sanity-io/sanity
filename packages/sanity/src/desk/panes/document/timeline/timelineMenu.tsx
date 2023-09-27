import {SelectIcon} from '@sanity/icons'
import {Button, Placement, Popover, useClickOutside, useGlobalKeyDown, useToast} from '@sanity/ui'
import {format} from 'date-fns'
import {upperFirst} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'
import {useFormState, useTimeline, useTimelineSelector} from 'sanity/document'
import {Chunk} from 'sanity'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
  placement?: Placement
}

const Root = styled(Popover)`
  overflow: hidden;
  overflow: clip;
`

export function TimelineMenu({chunk, mode, placement}: TimelineMenuProps) {
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)
  const toast = useToast()

  const {timelineStore, setRange} = useTimeline()
  const {ready} = useFormState()
  const {chunks, hasMoreChunks, isLoading, realRevChunk, sinceTime} = useTimelineSelector(
    (state) => ({
      chunks: state.chunks,
      isLoading: state.isLoading,
      hasMoreChunks: state.hasMoreChunks,
      realRevChunk: state.realRevChunk,
      sinceTime: state.sinceTime,
    }),
  )

  const handleOpen = useCallback(() => {
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

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
    [button, handleClose, open],
  )

  useClickOutside(handleClickOutside, [button, popover])
  useGlobalKeyDown(handleGlobalKeyDown)

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      try {
        const [sinceId, revId] = timelineStore.findRangeForRev(revChunk)
        setRange({since: sinceId, rev: revId})
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: 'Unable to load revision',
        })
      }
    },
    [setRange, timelineStore, toast],
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      try {
        const [sinceId, revId] = timelineStore.findRangeForSince(sinceChunk)
        setRange({since: sinceId, rev: revId})
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: 'Unable to load revision',
        })
      }
    },
    [setRange, timelineStore, toast],
  )

  const handleLoadMore = useCallback(() => {
    if (!isLoading) {
      timelineStore.loadMore()
    }
  }, [isLoading, timelineStore])

  const content = (
    <>
      {mode === 'rev' && (
        <Timeline
          chunks={chunks}
          firstChunk={realRevChunk}
          hasMoreChunks={hasMoreChunks}
          lastChunk={realRevChunk}
          onLoadMore={handleLoadMore}
          onSelect={selectRev}
        />
      )}
      {mode === 'since' && (
        <Timeline
          chunks={chunks}
          disabledBeforeFirstChunk
          firstChunk={realRevChunk}
          hasMoreChunks={hasMoreChunks}
          lastChunk={sinceTime}
          onLoadMore={handleLoadMore}
          onSelect={selectSince}
        />
      )}
    </>
  )

  const timeLabel = useFormattedTimestamp(chunk?.endTimestamp || '')

  const revLabel = chunk
    ? `${upperFirst(formatTimelineEventLabel(chunk.type))}: ${timeLabel}`
    : 'Latest version'

  const sinceLabel = chunk ? `Since: ${timeLabel}` : 'Since: unknown version'

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
        style={{maxWidth: '100%'}}
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
