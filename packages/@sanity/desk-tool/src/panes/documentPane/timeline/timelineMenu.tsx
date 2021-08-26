// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useTimeAgo} from '@sanity/base/hooks'
import {Chunk} from '@sanity/field/diff'
import {SelectIcon} from '@sanity/icons'
import {useClickOutside, Button, Box, Popover, Card} from '@sanity/ui'
import {upperFirst} from 'lodash'
import React, {useCallback, useState, useMemo} from 'react'
import {useDocumentHistory} from '../documentHistory'
import {sinceTimelineProps, revTimelineProps, formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
}

export function TimelineMenu({chunk, mode}: TimelineMenuProps) {
  const [open, setOpen] = useState(false)
  const [buttonRef, setButtonRef] = useState(null)
  const [menuContent, setMenuContent] = useState(null)

  const {historyController, setRange, setTimelineMode, timeline} = useDocumentHistory()

  const handleOpen = () => {
    setTimelineMode(mode)
    setOpen(true)
  }

  const handleClose = useCallback(() => {
    setTimelineMode('closed')
    setOpen(false)
  }, [setTimelineMode])

  const handleClickOutside = useCallback(() => {
    handleClose()
  }, [handleClose])

  useClickOutside(handleClickOutside, [menuContent, buttonRef])

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewRev(revChunk)
      setTimelineMode('closed')
      setOpen(false)
      setRange(sinceId, revId)
    },
    [historyController, setRange, setTimelineMode]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewSince(sinceChunk)
      setTimelineMode('closed')
      setOpen(false)
      setRange(sinceId, revId)
    },
    [historyController, setRange, setTimelineMode]
  )

  const loadMoreHistory = useCallback(
    (state: boolean) => {
      historyController.setLoadMore(state)
    },
    [historyController]
  )

  const content = useMemo(
    () =>
      open && (
        <Card ref={setMenuContent as any} radius={3}>
          {mode === 'rev' ? (
            <Timeline
              timeline={timeline}
              onSelect={selectRev}
              onLoadMore={loadMoreHistory}
              {...revTimelineProps(historyController.realRevChunk)}
            />
          ) : (
            <Timeline
              timeline={timeline}
              onSelect={selectSince}
              onLoadMore={loadMoreHistory}
              {...sinceTimelineProps(historyController.sinceTime!, historyController.realRevChunk)}
            />
          )}
        </Card>
      ),
    [
      historyController.realRevChunk,
      historyController.sinceTime,
      loadMoreHistory,
      mode,
      open,
      selectRev,
      selectSince,
      timeline,
    ]
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
    <Box margin={1} data-ui="versionMenu">
      <Popover
        content={content}
        referenceElement={buttonRef}
        open={open}
        boundaryElement={menuContent}
        portal
      >
        <Button
          ref={setButtonRef as any}
          text={open ? openLabel : buttonLabel}
          tone={open ? 'primary' : 'default'}
          selected={open}
          mode="bleed"
          fontSize={1}
          padding={2}
          iconRight={SelectIcon}
          onClick={open ? handleClose : handleOpen}
        />
      </Popover>
    </Box>
  )
}
