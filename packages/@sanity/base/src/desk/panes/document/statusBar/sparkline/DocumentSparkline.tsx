import {Box, Flex, useElementRect} from '@sanity/ui'
import React, {useEffect, useMemo, useState, memo, useLayoutEffect} from 'react'
import {useSyncState} from '../../../../../hooks'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {PublishStatus} from './PublishStatus'
import {ReviewChangesButton} from './ReviewChangesButton'

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
    historyController,
    value,
  } = useDocumentPane()
  const syncState = useSyncState(documentId, documentType)

  const lastUpdated = value?._updatedAt
  const lastPublished = editState?.published?._updatedAt
  const showingRevision = historyController.onOlderRevision()
  const liveEdit = Boolean(editState?.liveEdit)
  const published = Boolean(editState?.published)
  const changed = Boolean(editState?.draft)

  const [rootFlexElement, setRootFlexElement] = useState<HTMLDivElement | null>(null)
  const rootFlexRect = useElementRect(rootFlexElement)
  const collapsed = !rootFlexRect || rootFlexRect?.width < 300

  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (status === 'syncing') {
      // status changed to 'syncing', schedule an update to set it to 'saved'
      const timerId = setTimeout(() => setStatus('saved'), SYNCING_TIMEOUT)
      return () => clearTimeout(timerId)
    }
    if (status === 'saved') {
      // status changed to 'saved', schedule an update to clear it
      const timerId = setTimeout(() => setStatus(null), SAVED_TIMEOUT)
      return () => clearTimeout(timerId)
    }
  }, [status, lastUpdated])

  useLayoutEffect(() => {
    // clear sync status when documentId changes
    setStatus(null)
  }, [documentId])

  // set status to 'syncing' when lastUpdated changes and we go from not syncing to syncing
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
    ]
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
    [collapsed, lastPublished, lastUpdated, liveEdit, published, showingRevision]
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
