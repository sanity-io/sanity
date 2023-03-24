import {SelectIcon} from '@sanity/icons'
import {Button, Placement, Popover, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {format} from 'date-fns'
import {upperFirst} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
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
  const {historyController, setTimelineRange, setTimelineMode, ready} = useDocumentPane()
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)

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
      const [sinceId, revId] = historyController.findRangeForNewRev(revChunk)
      setTimelineMode('closed')
      setTimelineRange(sinceId, revId)
    },
    [historyController, setTimelineMode, setTimelineRange]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewSince(sinceChunk)
      setTimelineMode('closed')
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

  const content = (
    <>
      {mode === 'rev' && (
        <Timeline
          bottomSelection={historyController.realRevChunk}
          controller={historyController}
          onSelect={selectRev}
          onLoadMore={loadMoreHistory}
          topSelection={historyController.realRevChunk}
        />
      )}
      {mode === 'since' && (
        <Timeline
          bottomSelection={historyController.sinceTime!}
          controller={historyController}
          disabledBeforeSelection
          onSelect={selectSince}
          onLoadMore={loadMoreHistory}
          topSelection={historyController.realRevChunk}
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
