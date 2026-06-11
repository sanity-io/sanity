import {memo, type ReactNode} from 'react'

import {type TargetPerspective} from '../../../../perspective/types'
import {getVersionId} from '../../../../util/draftUtils'
import {type VersionContextMenuDialogState} from '../../../hooks/useVersionContextMenu'
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
  documentId: string
  documentType: string
  /** The perspective the menu acts on: 'published', 'draft', or a release ID. */
  bundleId: string
  isVersion: boolean
  /** Display title of the perspective the dialogs act on. */
  title: string
  /** The release or system bundle the dialogs act on behalf of. */
  sourceReleasePerspective: TargetPerspective
  onCreateVersion: (targetRelease: string) => void
  onCopyToDraftsNavigate: () => void
  isGoingToUnpublish?: boolean
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
    documentId,
    documentType,
    bundleId,
    isVersion,
    title,
    sourceReleasePerspective,
    onCreateVersion,
    onCopyToDraftsNavigate,
    isGoingToUnpublish = false,
    scheduledDraftDialogs,
  } = props

  return (
    <>
      {dialogState === 'discard-version' && (
        <DiscardVersionDialog
          onClose={onClose}
          documentId={isVersion ? getVersionId(documentId, bundleId) : documentId}
          fromPerspective={title}
          documentType={documentType}
          isGoingToUnpublish={isGoingToUnpublish}
        />
      )}

      {dialogState === 'create-release' && (
        <CopyToNewReleaseDialog
          onClose={onClose}
          onCreateVersion={onCreateVersion}
          documentId={isVersion ? getVersionId(documentId, bundleId) : documentId}
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
