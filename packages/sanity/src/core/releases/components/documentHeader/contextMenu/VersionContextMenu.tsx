import {type ReleaseDocument} from '@sanity/client'
import {memo, useEffect, useRef, useState} from 'react'

import {type UseScheduledDraftMenuActionsReturn} from '../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {useDocumentPairPermissions} from '../../../../store/grants/documentPairPermissions'
import {type VersionInfoDocumentStub} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {getVersionContextMenuParams} from '../../../util/getVersionContextMenuParams'
import {getReleaseDefaults} from '../../../util/util'
import {CanonicalReleaseContextMenu} from './CanonicalReleaseContextMenu'
import {ScheduledDraftContextMenu} from './ScheduledDraftContextMenu'

interface VersionContextMenuProps {
  versionDocument: VersionInfoDocumentStub
  documentType: string
  releases: ReleaseDocument[]
  releasesLoading: boolean
  onDiscard: () => void
  onCreateRelease: () => void
  onCopyToDrafts: () => void
  onCopyToDraftsNavigate: () => void
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  isGoingToUnpublish?: boolean
  release?: ReleaseDocument
  isScheduledDraft?: boolean
  scheduledDraftMenuActions?: UseScheduledDraftMenuActionsReturn
  /**
   * Whether the UI permits discarding versions.
   * Defaults to `true`.
   */
  isDiscardable?: boolean
}

export const VersionContextMenu = memo(function VersionContextMenu(props: VersionContextMenuProps) {
  const {
    versionDocument,
    documentType,
    releases,
    releasesLoading,
    onDiscard,
    onCreateRelease,
    onCopyToDrafts,
    onCopyToDraftsNavigate,
    onCreateVersion,
    disabled,
    locked,
    isGoingToUnpublish = false,
    release,
    isScheduledDraft,
    scheduledDraftMenuActions,
    isDiscardable = true,
  } = props

  const {documentId, bundleId, isVersion, isPublished, permissionVersion, permission} =
    getVersionContextMenuParams(versionDocument)

  const {checkWithPermissionGuard} = useReleasePermissions()
  const {createRelease} = useReleaseOperations()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: documentType,
    version: permissionVersion,
    // Note: the result of this discard permission check is disregarded for the published document
    // version. Discarding is never available for the published document version. Therefore, the
    // parameters provided here are not configured to handle published document versions.
    permission,
  })
  const hasDiscardPermission = !isPermissionsLoading && permissions?.granted

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    void checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((hasPermission) => {
      if (isMounted.current) setHasCreatePermission(hasPermission)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  // Scheduled drafts use different menu with publish-now, reschedule, and delete actions
  if (isScheduledDraft && isVersion && release && scheduledDraftMenuActions) {
    return (
      <ScheduledDraftContextMenu
        releases={releases}
        bundleId={bundleId}
        release={release}
        onCreateRelease={onCreateRelease}
        onCopyToDrafts={onCopyToDrafts}
        onCopyToDraftsNavigate={onCopyToDraftsNavigate}
        onCreateVersion={onCreateVersion}
        disabled={disabled}
        isGoingToUnpublish={isGoingToUnpublish}
        hasCreatePermission={hasCreatePermission}
        scheduledDraftMenuActions={scheduledDraftMenuActions}
        documentId={documentId}
        documentType={documentType}
      />
    )
  }

  return (
    <CanonicalReleaseContextMenu
      releases={releases}
      releasesLoading={releasesLoading}
      bundleId={bundleId}
      release={release}
      isVersion={isVersion}
      onDiscard={onDiscard}
      onCreateRelease={onCreateRelease}
      onCopyToDrafts={onCopyToDrafts}
      onCopyToDraftsNavigate={onCopyToDraftsNavigate}
      onCreateVersion={onCreateVersion}
      disabled={disabled}
      locked={locked}
      isGoingToUnpublish={isGoingToUnpublish}
      hasCreatePermission={hasCreatePermission}
      hasDiscardPermission={hasDiscardPermission || false}
      isPublished={isPublished}
      isDiscardable={isDiscardable}
      documentId={documentId}
      documentType={documentType}
    />
  )
})
