import {type ReleaseDocument} from '@sanity/client'
import {memo, useEffect, useRef, useState} from 'react'

import {type UseScheduledDraftMenuActionsReturn} from '../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {useDocumentPairPermissions} from '../../../../store/_legacy/grants/documentPairPermissions'
import {getPublishedId, isPublishedId} from '../../../../util/draftUtils'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {getReleaseDefaults} from '../../../util/util'
import {CanonicalReleaseContextMenu} from './CanonicalReleaseContextMenu'
import {ScheduledDraftContextMenu} from './ScheduledDraftContextMenu'

interface VersionContextMenuProps {
  documentId: string
  releases: ReleaseDocument[]
  releasesLoading: boolean
  fromRelease: string
  isVersion: boolean
  onDiscard: () => void
  onCreateRelease: () => void
  onCopyToDrafts: () => void
  onCopyToDraftsNavigate: () => void
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  type: string
  isGoingToUnpublish?: boolean
  release?: ReleaseDocument
  isScheduledDraft?: boolean
  scheduledDraftMenuActions?: UseScheduledDraftMenuActionsReturn
}

export const VersionContextMenu = memo(function VersionContextMenu(props: VersionContextMenuProps) {
  const {
    documentId,
    releases,
    releasesLoading,
    fromRelease,
    isVersion,
    onDiscard,
    onCreateRelease,
    onCopyToDrafts,
    onCopyToDraftsNavigate,
    onCreateVersion,
    disabled,
    locked,
    type,
    isGoingToUnpublish = false,
    release,
    isScheduledDraft,
    scheduledDraftMenuActions,
  } = props
  const isPublished = isPublishedId(documentId) && !isVersion

  const {checkWithPermissionGuard} = useReleasePermissions()
  const {createRelease} = useReleaseOperations()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: getPublishedId(documentId),
    type,
    version: isVersion ? fromRelease : undefined,
    // Note: the result of this discard permission check is disregarded for the published document
    // version. Discarding is never available for the published document version. Therefore, the
    // parameters provided here are not configured to handle published document versions.
    permission: fromRelease === 'draft' ? 'discardDraft' : 'discardVersion',
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
        fromRelease={fromRelease}
        onCreateRelease={onCreateRelease}
        onCopyToDrafts={onCopyToDrafts}
        onCopyToDraftsNavigate={onCopyToDraftsNavigate}
        onCreateVersion={onCreateVersion}
        disabled={disabled}
        isGoingToUnpublish={isGoingToUnpublish}
        hasCreatePermission={hasCreatePermission}
        scheduledDraftMenuActions={scheduledDraftMenuActions}
        documentId={documentId}
        documentType={type}
      />
    )
  }

  return (
    <CanonicalReleaseContextMenu
      releases={releases}
      releasesLoading={releasesLoading}
      fromRelease={fromRelease}
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
      documentId={documentId}
      documentType={type}
    />
  )
})
