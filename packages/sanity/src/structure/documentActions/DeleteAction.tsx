import {TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo, useState} from 'react'
import {catchError, filter, firstValueFrom, map, of, timeout} from 'rxjs'
import {
  type DocumentActionComponent,
  getVersionFromId,
  InsufficientPermissionsMessage,
  isAgentBundleName,
  isReleaseScheduledOrScheduling,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useDocumentStore,
  useDocumentVersionTypeSortedList,
  useTranslation,
} from 'sanity'

import {ConfirmDeleteDialog, type DeleteReferenceCounts} from '../components'
import {structureLocaleNamespace} from '../i18n'
import {DocumentDeleted} from './__telemetry__/documentActions.telemetry'

const DISABLED_REASON_TITLE_KEY = {
  NOTHING_TO_DELETE: 'action.delete.disabled.nothing-to-delete',
  NOT_READY: 'action.delete.disabled.not-ready',
}

// operationEvents switchMaps per document, so a superseding operation drops the
// delete before it emits an outcome. The telemetry wait is bounded so its
// subscription is released when no outcome ever arrives.
const DELETE_OUTCOME_TIMEOUT = 30000

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useDeleteAction: DocumentActionComponent = ({id, type, draft, version}) => {
  const bundleId = version?._id && getVersionFromId(version._id)
  const isAgentBundle = isAgentBundleName(bundleId)
  const {delete: deleteOp} = useDocumentOperation(id, type, bundleId)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const documentStore = useDocumentStore()
  const telemetry = useTelemetry()

  const {t} = useTranslation(structureLocaleNamespace)

  const {sortedDocumentList} = useDocumentVersionTypeSortedList({documentId: id})
  const hasScheduledRelease = sortedDocumentList.some(isReleaseScheduledOrScheduling)

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  const handleConfirm = useCallback(
    (versions: string[], referenceCounts: DeleteReferenceCounts) => {
      const {
        totalReferenceCount: referenceCount,
        internalReferenceCount,
        crossDatasetReferenceCount,
      } = referenceCounts
      const referenceInfo = {
        documentId: id,
        referenceCount,
        internalReferenceCount,
        crossDatasetReferenceCount,
      }

      setConfirmDialogOpen(false)
      setIsDeleting(true)

      telemetry.log(DocumentDeleted, {...referenceInfo, stage: 'confirmed'})

      // Log the result without gating UI state on it. Subscribe before executing
      // so we don't miss the outcome.
      void firstValueFrom(
        documentStore.pair.operationEvents(id, type).pipe(
          filter((event) => event.op === 'delete'),
          map((event) => event.type),
          timeout({first: DELETE_OUTCOME_TIMEOUT}),
          catchError(() => of('dropped' as const)),
        ),
      ).then((outcome) => {
        if (outcome !== 'dropped') {
          telemetry.log(DocumentDeleted, {
            ...referenceInfo,
            stage: outcome === 'success' ? 'deleted' : 'failed',
          })
        }
      })

      deleteOp.execute(versions)
      setIsDeleting(false)
    },
    [deleteOp, documentStore.pair, id, telemetry, type],
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
    if (isAgentBundle) return null

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
    isAgentBundle,
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
