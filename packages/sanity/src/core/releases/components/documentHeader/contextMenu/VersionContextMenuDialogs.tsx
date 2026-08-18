import {memo, type ReactNode} from 'react'

import {type TargetPerspective} from '../../../../perspective/types'
import {type CopyToDraftsOptions} from '../../../hooks/useCopyToDrafts'
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
  versionId: string
  documentType: string
  /** Display title of the perspective the dialogs act on. */
  title: string
  /** The release or system bundle the dialogs act on behalf of. */
  sourceReleasePerspective: TargetPerspective
  onCreateVersion: (targetRelease: string) => void
  onCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
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
    documentType,
    versionId,
    title,
    sourceReleasePerspective,
    onCreateVersion,
    onCopyToDrafts,
    isGoingToUnpublish = false,
    isDiscardable = true,
    scheduledDraftDialogs,
  } = props

  return (
    <>
      {dialogState === 'discard-version' && isDiscardable && (
        <DiscardVersionDialog
          onClose={onClose}
          versionId={versionId}
          fromPerspective={title}
          documentType={documentType}
          isGoingToUnpublish={isGoingToUnpublish}
          // Rendered from the document header, where `DocumentOperationResults` already toasts
          // the discard operation events this dialog would report.
          showCompletionToasts={false}
        />
      )}

      {dialogState === 'create-release' && (
        <CopyToNewReleaseDialog
          onClose={onClose}
          onCreateVersion={onCreateVersion}
          versionId={versionId}
          documentType={documentType}
          release={sourceReleasePerspective}
          title={title}
        />
      )}

      {dialogState === 'copy-to-drafts' && (
        <CopyToDraftsDialog onClose={onClose} onConfirm={onCopyToDrafts} />
      )}
      {scheduledDraftDialogs}
    </>
  )
})
