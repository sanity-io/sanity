import {Flex, useElementSize} from '@sanity/ui'
import React, {useState, memo, useLayoutEffect, useEffect} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusLine} from './DocumentStatusLine'
import {DocumentStatusPulse} from './DocumentStatusPulse'
import {useSyncState} from 'sanity'

const SYNCING_TIMEOUT = 1000
const SAVED_TIMEOUT = 3000

export const DocumentSparkline = memo(function DocumentSparkline() {
  const {badges, documentId, documentType, editState, value} = useDocumentPane()
  const syncState = useSyncState(documentId, documentType)

  const lastUpdated = value?._updatedAt

  const [rootFlexElement, setRootFlexElement] = useState<HTMLDivElement | null>(null)
  const rootFlexRect = useElementSize(rootFlexElement)
  const collapsed = !rootFlexRect || rootFlexRect?.content.width < 380

  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)

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

  if (!editState?.ready) {
    return null
  }

  return (
    <Flex align="center" data-ui="DocumentSparkline" ref={setRootFlexElement}>
      <Flex align="center" flex={1} gap={3}>
        <DocumentStatusLine collapsed={collapsed} editState={editState} />
        <DocumentStatusPulse collapsed={collapsed} status={status || undefined} />
        {badges && <DocumentBadges />}
      </Flex>
    </Flex>
  )
})
