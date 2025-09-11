import {type ReleaseDocument} from '@sanity/client'
import {memo, useEffect, useRef, useState} from 'react'

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
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  type: string
  isGoingToUnpublish?: boolean
  release?: ReleaseDocument
  onChangeSchedule?: () => void
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
    onCreateVersion,
    disabled,
    locked,
    type,
    isGoingToUnpublish = false,
    release,
    onChangeSchedule,
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

    checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((hasPermission) => {
      if (isMounted.current) setHasCreatePermission(hasPermission)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  const isScheduledDraft = release && release.metadata.cardinality === 'one'

  // Scheduled drafts use different menu with publish-now, reschedule, and delete actions
  if (isScheduledDraft && isVersion && release) {
    return (
      <ScheduledDraftContextMenu
        releases={releases}
        fromRelease={fromRelease}
        onCreateRelease={onCreateRelease}
        onCreateVersion={onCreateVersion}
        disabled={disabled}
        type={type}
        isGoingToUnpublish={isGoingToUnpublish}
        release={release}
        onChangeSchedule={onChangeSchedule}
        hasCreatePermission={hasCreatePermission}
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
      onCreateVersion={onCreateVersion}
      disabled={disabled}
      locked={locked}
      isGoingToUnpublish={isGoingToUnpublish}
      hasCreatePermission={hasCreatePermission}
      hasDiscardPermission={hasDiscardPermission || false}
      isPublished={isPublished}
    />
  )
})
