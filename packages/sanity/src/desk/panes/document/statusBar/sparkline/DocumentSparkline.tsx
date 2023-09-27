import {Box, Flex, useElementRect} from '@sanity/ui'
import React, {useEffect, useMemo, useState, memo, useLayoutEffect} from 'react'
import {useDocumentId, useDocumentType, useFormState, useTimelineSelector} from 'sanity/document'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {PublishStatus} from './PublishStatus'
import {ReviewChangesButton} from './ReviewChangesButton'
import {useSyncState} from 'sanity'

const SYNCING_TIMEOUT = 1000
const SAVED_TIMEOUT = 3000

export const DocumentSparkline = memo(function DocumentSparkline() {
  const documentId = useDocumentId()
  const documentType = useDocumentType()
  const {value, editState} = useFormState()
  const {changesOpen, onHistoryClose, onHistoryOpen} = useDocumentPane()
  const syncState = useSyncState(documentId, documentType)

  const lastUpdated = value?._updatedAt
  const lastPublished = editState?.published?._updatedAt
  const liveEdit = Boolean(editState?.liveEdit)
  const published = Boolean(editState?.published)
  const changed = Boolean(editState?.draft)

  const [rootFlexElement, setRootFlexElement] = useState<HTMLDivElement | null>(null)
  const rootFlexRect = useElementRect(rootFlexElement)
  const collapsed = !rootFlexRect || rootFlexRect?.width < 300

  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)

  // Subscribe to TimelineController changes and store internal state.
  const showingRevision = useTimelineSelector((state) => state.onOlderRevision)

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    // Schedule an update to set the status to 'saved' when status changed to 'syncing.
    // We use `syncState.isSyncing` here to avoid the status being set to 'saved' when the document is syncing.
    if (status === 'syncing' && !syncState.isSyncing) {
      const timerId = setTimeout(() => setStatus('saved'), SYNCING_TIMEOUT)
      return () => clearTimeout(timerId)
    }
    // Schedule an update to clear the status when status changed to 'saved'
    if (status === 'saved') {
      const timerId = setTimeout(() => setStatus(null), SAVED_TIMEOUT)
      return () => clearTimeout(timerId)
    }
  }, [status, lastUpdated, syncState.isSyncing])

  // Clear the status when documentId changes to make sure we don't show the wrong status when opening a new document
  useLayoutEffect(() => {
    setStatus(null)
  }, [documentId])

  // Set status to 'syncing' when lastUpdated changes and we go from not syncing to syncing
  useLayoutEffect(() => {
    if (syncState.isSyncing) {
      setStatus('syncing')
    }
  }, [syncState.isSyncing, lastUpdated])

  const reviewButton = useMemo(
    () => (
      <ReviewChangesButton
        lastUpdated={lastUpdated}
        status={status || (changed ? 'changes' : undefined)}
        onClick={changesOpen ? onHistoryClose : onHistoryOpen}
        disabled={showingRevision}
        selected={changesOpen}
        collapsed={collapsed}
      />
    ),
    [
      changed,
      changesOpen,
      onHistoryClose,
      onHistoryOpen,
      lastUpdated,
      showingRevision,
      status,
      collapsed,
    ],
  )

  const publishStatus = useMemo(
    () =>
      (liveEdit || published) && (
        <Box marginRight={1}>
          <PublishStatus
            disabled={showingRevision}
            lastPublished={lastPublished}
            lastUpdated={lastUpdated}
            liveEdit={liveEdit}
            collapsed={collapsed}
          />
        </Box>
      ),
    [collapsed, lastPublished, lastUpdated, liveEdit, published, showingRevision],
  )

  return (
    <Flex align="center" data-ui="DocumentSparkline" ref={setRootFlexElement}>
      {publishStatus}

      <Flex align="center" flex={1}>
        {reviewButton}
        {!collapsed && (
          <Box marginLeft={3}>
            <DocumentBadges />
          </Box>
        )}
      </Flex>
    </Flex>
  )
})
