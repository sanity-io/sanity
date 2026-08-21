import {type ReleaseDocument} from '@sanity/client'
import {memo, useEffect, useMemo, useRef, useState} from 'react'

import {
  getDiscardDocumentActionId,
  getVersionContextMenuActionsContext,
  useConfiguredDocumentActionIds,
} from '../../../../config/document/useConfiguredDocumentActionIds'
import {type UseScheduledDraftMenuActionsReturn} from '../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {useDocumentPairPermissions} from '../../../../store/grants/documentPairPermissions'
import {getVersionFromId, isPublishedId} from '../../../../util/draftUtils'
import {type CopyToDraftsOptions} from '../../../hooks/useCopyToDrafts'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {getReleaseDefaults} from '../../../util/util'
import {CanonicalReleaseContextMenu} from './CanonicalReleaseContextMenu'
import {ScheduledDraftContextMenu} from './ScheduledDraftContextMenu'

interface VersionContextMenuProps {
  documentGroupId: string
  releases: ReleaseDocument[]
  releasesLoading: boolean
  fromRelease: string
  versionId: string
  onDiscard: () => void
  onCreateRelease: () => void
  onCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  type: string
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
    documentGroupId,
    releases,
    releasesLoading,
    fromRelease,
    onDiscard,
    versionId,
    onCreateRelease,
    onCopyToDrafts,
    onCreateVersion,
    disabled,
    locked,
    type,
    isGoingToUnpublish = false,
    release,
    isScheduledDraft,
    scheduledDraftMenuActions,
    isDiscardable = true,
  } = props
  const isPublished = isPublishedId(versionId)
  const versionName = getVersionFromId(versionId)

  const documentActionsContext = useMemo(
    () =>
      getVersionContextMenuActionsContext({
        schemaType: type,
        documentGroupId,
        fromRelease,
        isScheduledDraft,
      }),
    [type, documentGroupId, fromRelease, isScheduledDraft],
  )
  const configuredActionIds = useConfiguredDocumentActionIds(documentActionsContext)

  const discardActionId = getDiscardDocumentActionId({fromRelease, isScheduledDraft})
  const isDiscardActionConfigured = discardActionId
    ? configuredActionIds.has(discardActionId)
    : false
  const canDiscardVersion = isDiscardable && isDiscardActionConfigured

  const {checkWithPermissionGuard} = useReleasePermissions()
  const {createRelease} = useReleaseOperations()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)

  // TODO: SAPP-4023: update this component to receive the `VersionInfoDocumentStub` instead of a plain id, and use that
  // stub to verify permissions and run the actions on the specific version.
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentGroupId,
    type,
    version: versionName,
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
  if (isScheduledDraft && versionName && release && scheduledDraftMenuActions) {
    return (
      <ScheduledDraftContextMenu
        releases={releases}
        bundleId={fromRelease}
        release={release}
        onCreateRelease={onCreateRelease}
        onCopyToDrafts={onCopyToDrafts}
        onCreateVersion={onCreateVersion}
        disabled={disabled}
        isGoingToUnpublish={isGoingToUnpublish}
        hasCreatePermission={hasCreatePermission}
        scheduledDraftMenuActions={scheduledDraftMenuActions}
        documentType={type}
        showPublishNow={configuredActionIds.has('publish')}
        showEditSchedule={configuredActionIds.has('schedule')}
        showDeleteSchedule={configuredActionIds.has('discardVersion')}
      />
    )
  }

  return (
    <CanonicalReleaseContextMenu
      releases={releases}
      releasesLoading={releasesLoading}
      bundleId={fromRelease}
      release={release}
      onDiscard={onDiscard}
      onCreateRelease={onCreateRelease}
      onCopyToDrafts={onCopyToDrafts}
      onCreateVersion={onCreateVersion}
      disabled={disabled}
      locked={locked}
      isGoingToUnpublish={isGoingToUnpublish}
      hasCreatePermission={hasCreatePermission}
      hasDiscardPermission={hasDiscardPermission || false}
      isPublished={isPublished}
      isDiscardable={canDiscardVersion}
      documentType={type}
    />
  )
})
