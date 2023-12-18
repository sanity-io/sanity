import {Flex} from '@sanity/ui'
import React, {useEffect, useLayoutEffect, useState} from 'react'
import {Tooltip} from '../../../../ui-components'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusPulse} from './DocumentStatusPulse'
import {useSyncState, DocumentStatusIndicator, DocumentStatus} from 'sanity'

const SYNCING_TIMEOUT = 1000
const SAVED_TIMEOUT = 3000

interface DocumentStatusLineProps {
  singleLine?: boolean
}

export function DocumentStatusLine({singleLine}: DocumentStatusLineProps) {
  const {documentId, documentType, editState, value} = useDocumentPane()

  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)

  const syncState = useSyncState(documentId, documentType)

  const lastUpdated = value?._updatedAt

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

  if (status) {
    return <DocumentStatusPulse status={status || undefined} />
  }

  return (
    <Tooltip
      content={
        <DocumentStatus absoluteDate draft={editState?.draft} published={editState?.published} />
      }
      placement="top"
    >
      <Flex align="center" gap={2}>
        <DocumentStatusIndicator draft={editState?.draft} published={editState?.published} />
        <DocumentStatus
          draft={editState?.draft}
          published={editState?.published}
          singleLine={singleLine}
        />
      </Flex>
    </Tooltip>
  )
}
