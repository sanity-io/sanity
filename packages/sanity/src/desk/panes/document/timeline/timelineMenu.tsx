import {SelectIcon} from '@sanity/icons'
import {useClickOutside, Button, Popover, Placement, useGlobalKeyDown} from '@sanity/ui'
import {upperFirst} from 'lodash'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {sinceTimelineProps, revTimelineProps, formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'
import {Chunk, useTimeAgo} from 'sanity'

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

  const timeAgo = useTimeAgo(chunk?.endTimestamp || '', {agoSuffix: true})

  const revLabel = chunk
    ? `${upperFirst(formatTimelineEventLabel(chunk.type))} ${timeAgo}`
    : 'Current version'

  const sinceLabel = chunk
    ? `Since ${formatTimelineEventLabel(chunk.type)} ${timeAgo}`
    : 'Since unknown version'

  const openLabel = mode === 'rev' ? 'Select version' : 'Review changes since'
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
        text={open ? openLabel : buttonLabel}
      />
    </Root>
  )
}
