import {TrashIcon} from '@sanity/icons'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  getVersionFromId,
  InsufficientPermissionsMessage,
  isReleaseScheduledOrScheduling,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useDocumentVersionTypeSortedList,
  useTranslation,
} from 'sanity'

import {ConfirmDeleteDialog} from '../components'
import {structureLocaleNamespace} from '../i18n'

const DISABLED_REASON_TITLE_KEY = {
  NOTHING_TO_DELETE: 'action.delete.disabled.nothing-to-delete',
  NOT_READY: 'action.delete.disabled.not-ready',
}

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useDeleteAction: DocumentActionComponent = ({id, type, draft, version}) => {
  const bundleId = version?._id && getVersionFromId(version._id)
  const {delete: deleteOp} = useDocumentOperation(id, type, bundleId)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const {t} = useTranslation(structureLocaleNamespace)

  const {sortedDocumentList} = useDocumentVersionTypeSortedList({documentId: id})
  const hasScheduledRelease = sortedDocumentList.some(isReleaseScheduledOrScheduling)

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  const handleConfirm = useCallback(
    (versions: string[]) => {
      setConfirmDialogOpen(false)
      setIsDeleting(true)
      deleteOp.execute(versions)
      setIsDeleting(false)
    },
    [deleteOp],
  )

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: bundleId,
    permission: 'delete',
  })

  const currentUser = useCurrentUser()

  return useMemo(() => {
    if (!isPermissionsLoading && !permissions?.granted) {
      return {
        tone: 'critical',
        icon: TrashIcon,
        disabled: true,
        label: t('action.delete.label'),
        title: (
          <InsufficientPermissionsMessage context="delete-document" currentUser={currentUser} />
        ),
      }
    }

    const getTitle = () => {
      if (hasScheduledRelease) {
        return t('action.delete.disabled.scheduled-release')
      }
      if (deleteOp.disabled) {
        return t(DISABLED_REASON_TITLE_KEY[deleteOp.disabled])
      }
      return ''
    }

    return {
      tone: 'critical',
      icon: TrashIcon,
      disabled:
        isDeleting || hasScheduledRelease || Boolean(deleteOp.disabled) || isPermissionsLoading,
      title: getTitle(),
      label: isDeleting ? t('action.delete.running.label') : t('action.delete.label'),
      shortcut: 'Ctrl+Alt+D',
      onHandle: handle,
      dialog: isConfirmDialogOpen && {
        type: 'custom',
        component: (
          <ConfirmDeleteDialog
            action="delete"
            id={draft?._id || id}
            type={type}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        ),
      },
    }
  }, [
    currentUser,
    deleteOp.disabled,
    draft?._id,
    handle,
    handleCancel,
    handleConfirm,
    hasScheduledRelease,
    id,
    isConfirmDialogOpen,
    isDeleting,
    isPermissionsLoading,
    permissions?.granted,
    t,
    type,
  ])
}

useDeleteAction.action = 'delete'
useDeleteAction.displayName = 'DeleteAction'
