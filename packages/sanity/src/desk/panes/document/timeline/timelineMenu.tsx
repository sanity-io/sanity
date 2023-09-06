import {SelectIcon} from '@sanity/icons'
import {Button, Placement, Popover, useClickOutside, useGlobalKeyDown, useToast} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {TimelineError} from './TimelineError'
import {Timeline} from './timeline'
import {Chunk, useTimelineSelector, useTranslation} from 'sanity'

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
  const {setTimelineRange, setTimelineMode, timelineError, ready, timelineStore} = useDocumentPane()
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)
  const toast = useToast()

  const chunks = useTimelineSelector(timelineStore, (state) => state.chunks)
  const loading = useTimelineSelector(timelineStore, (state) => state.isLoading)
  const hasMoreChunks = useTimelineSelector(timelineStore, (state) => state.hasMoreChunks)
  const realRevChunk = useTimelineSelector(timelineStore, (state) => state.realRevChunk)
  const sinceTime = useTimelineSelector(timelineStore, (state) => state.sinceTime)

  const {t} = useTranslation('studio')

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
    [button, handleClose, open],
  )

  useClickOutside(handleClickOutside, [button, popover])
  useGlobalKeyDown(handleGlobalKeyDown)

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      try {
        const [sinceId, revId] = timelineStore.findRangeForRev(revChunk)
        setTimelineMode('closed')
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
    [setTimelineMode, setTimelineRange, t, timelineStore, toast],
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      try {
        const [sinceId, revId] = timelineStore.findRangeForSince(sinceChunk)
        setTimelineMode('closed')
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
    [setTimelineMode, setTimelineRange, t, timelineStore, toast],
  )

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      timelineStore.loadMore()
    }
  }, [loading, timelineStore])

  const content = timelineError ? (
    <TimelineError />
  ) : (
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

  const revLabel = chunk ? t(`timeline.${chunk.type}`) : t('timeline.latest-version')

  const sinceLabel = chunk
    ? t('timeline.since', {
        timestamp: new Date(chunk?.endTimestamp),
        formatParams: {
          timestamp: {dateStyle: 'medium', timeStyle: 'short'},
        },
      })
    : t('timeline.since-version-missing')

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
        text={ready ? buttonLabel : t('timeline.loading-history')}
      />
    </Root>
  )
}
