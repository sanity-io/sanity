import {useTimeAgo} from '@sanity/base/hooks'
import {Chunk} from '@sanity/field/diff'
import {SelectIcon} from '@sanity/icons'
import {useClickOutside, Button, Box, Popover} from '@sanity/ui'
import {upperFirst} from 'lodash'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {useDocumentHistory} from '../documentHistory'
import {sinceTimelineProps, revTimelineProps, formatTimelineEventLabel} from './helpers'
import {Timeline} from './timeline'

interface TimelineMenuProps {
  chunk: Chunk | null
  mode: 'rev' | 'since'
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

  const content = open && (
    <div ref={setMenuContent as any}>
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
    <Box margin={1} data-ui="versionMenu">
      <Root constrainSize content={content} referenceElement={buttonRef} open={open} portal>
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
      </Root>
    </Box>
  )
}
