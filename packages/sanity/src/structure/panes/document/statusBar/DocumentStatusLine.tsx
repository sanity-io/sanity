import {Flex} from '@sanity/ui'
import {useEffect, useLayoutEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {
  DocumentStatus,
  getPreviewStateObservable,
  getReleaseIdFromReleaseDocumentId,
  isPublishedPerspective,
  useDocumentPreviewStore,
  useReleases,
  useSchema,
  useStudioPerspectiveState,
  useSyncState,
} from 'sanity'

import {useCurrentRelease} from '../../../../core/releases/hooks/useCurrentRelease'
import {Tooltip} from '../../../../ui-components'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusPulse} from './DocumentStatusPulse'

const SYNCING_TIMEOUT = 1000
const SAVED_TIMEOUT = 3000

export function DocumentStatusLine() {
  const {documentId, documentType, editState, value} = useDocumentPane()
  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)
  const documentPreviewStore = useDocumentPreviewStore()
  const schema = useSchema()
  const schemaType = schema.get(documentType)
  const releases = useReleases()

  const {current: currentPerspective} = useStudioPerspectiveState()
  const currentRelease = useCurrentRelease()
  const previewStateObservable = useMemo(() => {
    const releaseIds = (releases.data ?? []).map((release) =>
      getReleaseIdFromReleaseDocumentId(release._id),
    )
    return schemaType
      ? getPreviewStateObservable(documentPreviewStore, schemaType, value._id, releaseIds)
      : of({versions: {}})
  }, [documentPreviewStore, schemaType, value._id, releases.data])
  const {versions} = useObservable(previewStateObservable, {versions: {}})

  const syncState = useSyncState(documentId, documentType, {version: editState?.bundleId})

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

  const getMode = () => {
    if (!currentPerspective) {
      return 'draft'
    }
    if (isPublishedPerspective(currentPerspective)) {
      return 'published'
    }
    return 'version'
  }
  const mode = getMode()

  const isReleasePerspective = currentPerspective && !isPublishedPerspective(currentPerspective)

  if (status) {
    return <DocumentStatusPulse status={status || undefined} />
  }
  return (
    <Tooltip
      content={
        <DocumentStatus
          draft={editState?.draft}
          published={editState?.published}
          versions={versions}
        />
      }
      placement="top"
    >
      <Flex align="center" gap={3} data-ui="document-status-line">
        {/* Shows only 1 line of document status */}
        <DocumentStatus
          draft={mode === 'draft' ? editState?.draft : undefined}
          published={mode === 'published' ? editState?.published : undefined}
          versions={
            mode === 'version' && isReleasePerspective && currentRelease?.name && editState?.version
              ? {
                  [currentRelease.name]: {snapshot: editState?.version},
                }
              : undefined
          }
        />
      </Flex>
    </Tooltip>
  )
}
