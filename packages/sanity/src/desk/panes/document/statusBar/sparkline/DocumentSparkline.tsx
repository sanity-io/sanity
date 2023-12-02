import {Box, Flex, Text, useElementRect} from '@sanity/ui'
import React, {useEffect, useState, memo, useLayoutEffect} from 'react'
import {DocumentStatus} from '../../../../../ui/documentStatus'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusPulse} from './DocumentStatusPulse'
import {useDocumentStatusTimeAgo, useSyncState, useTimelineSelector} from 'sanity'

const SYNCING_TIMEOUT = 1000
const SAVED_TIMEOUT = 3000

export const DocumentSparkline = memo(function DocumentSparkline() {
  const {
    changesOpen,
    documentId,
    documentType,
    editState,
    onHistoryClose,
    onHistoryOpen,
    timelineStore,
    value,
  } = useDocumentPane()
  const syncState = useSyncState(documentId, documentType)

  const lastUpdated = value?._updatedAt

  const [rootFlexElement, setRootFlexElement] = useState<HTMLDivElement | null>(null)
  const rootFlexRect = useElementRect(rootFlexElement)
  const collapsed = !rootFlexRect || rootFlexRect?.width < 300

  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)

  // Subscribe to TimelineController changes and store internal state.
  const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

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

  const statusTimeAgo = useDocumentStatusTimeAgo({
    draft: editState?.draft,
    hidePublishedDate: true,
    published: editState?.published,
  })

  return (
    <Flex align="center" data-ui="DocumentSparkline" ref={setRootFlexElement}>
      <Flex align="center" flex={1} gap={3} marginLeft={3}>
        <Flex align="center" gap={2}>
          <DocumentStatus
            draft={editState?.draft}
            published={editState?.published}
            showPublishedIcon
          />
          <Box flex={1}>
            <Text muted textOverflow="ellipsis" size={1} weight="medium">
              {statusTimeAgo}
            </Text>
          </Box>
        </Flex>

        <DocumentStatusPulse
          status={status || undefined}
          onClick={changesOpen ? onHistoryClose : onHistoryOpen}
          disabled={showingRevision}
          selected={changesOpen}
          collapsed={collapsed}
        />

        {!collapsed && <DocumentBadges />}
      </Flex>
    </Flex>
  )
})
