import {memo, type ReactNode} from 'react'

import {type TargetPerspective} from '../../../../perspective/types'
import {type VersionContextMenuDialogState} from '../../../hooks/useVersionContextMenu'
import {type VersionInfoDocumentStub} from '../../../store/types'
import {getVersionContextMenuParams} from '../../../util/getVersionContextMenuParams'
import {DiscardVersionDialog} from '../../dialog/DiscardVersionDialog'
import {CopyToDraftsDialog} from '../dialog/CopyToDraftsDialog'
import {CopyToNewReleaseDialog} from '../dialog/CopyToNewReleaseDialog'

/**
 * @internal
 */
export interface VersionContextMenuDialogsProps {
  /** The dialog state returned by `useVersionContextMenu`. */
  dialogState: VersionContextMenuDialogState
  onClose: () => void
  versionDocument: VersionInfoDocumentStub
  documentType: string
  /** Display title of the perspective the dialogs act on. */
  title: string
  /** The release or system bundle the dialogs act on behalf of. */
  sourceReleasePerspective: TargetPerspective
  onCreateVersion: (targetRelease: string) => void
  onCopyToDraftsNavigate: () => void
  isGoingToUnpublish?: boolean
  /**
   * Whether the UI permits discarding versions.
   * Defaults to `true`.
   */
  isDiscardable?: boolean
  /** Dialogs rendered for scheduled draft actions, if any. */
  scheduledDraftDialogs?: ReactNode
}

/**
 * Renders the dialog (if any) opened from the version context menu. Use
 * together with `useVersionContextMenu` and `VersionContextMenuPopover`.
 *
 * @internal
 */
export const VersionContextMenuDialogs = memo(function VersionContextMenuDialogs(
  props: VersionContextMenuDialogsProps,
) {
  const {
    dialogState,
    onClose,
    versionDocument,
    documentType,
    title,
    sourceReleasePerspective,
    onCreateVersion,
    onCopyToDraftsNavigate,
    isGoingToUnpublish = false,
    isDiscardable = true,
    scheduledDraftDialogs,
  } = props

  const {documentId, bundleId, isVersion} = getVersionContextMenuParams(versionDocument)
  const versionDocumentId = isVersion ? versionDocument._id : documentId

  return (
    <>
      {dialogState === 'discard-version' && isDiscardable && (
        <DiscardVersionDialog
          onClose={onClose}
          documentId={versionDocumentId}
          fromPerspective={title}
          documentType={documentType}
          isGoingToUnpublish={isGoingToUnpublish}
        />
      )}

      {dialogState === 'create-release' && (
        <CopyToNewReleaseDialog
          onClose={onClose}
          onCreateVersion={onCreateVersion}
          documentId={versionDocumentId}
          documentType={documentType}
          release={sourceReleasePerspective}
          title={title}
        />
      )}

      {dialogState === 'copy-to-drafts' && (
        <CopyToDraftsDialog
          onClose={onClose}
          documentId={documentId}
          fromRelease={bundleId}
          onNavigate={onCopyToDraftsNavigate}
        />
      )}
      {scheduledDraftDialogs}
    </>
  )
})
