import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {defer} from 'rxjs'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../i18n'
import {useVariantOperations} from '../store/useVariantOperations'
import {useVariantPermissions} from '../store/useVariantPermissions'
import {
  getReferencingDocumentCount,
  isInsufficientPermissionsError,
} from '../store/variantActionErrors'

interface UseVariantDeleteActionOptions {
  documentCount?: number | null
  documentsLoading?: boolean
  onDeleted?: () => void
  variantTitle?: string
}

/**
 * Shared delete action state for variant menu buttons.
 *
 * Delete is disabled while the document count is unknown or non-zero, and while the current
 * user is not known to be allowed to delete definitions (checked with a dry run of the delete,
 * like the releases tool does). The server enforces both anyway; if it still refuses, the
 * error toast explains why when the reason is one of those two.
 *
 * @internal
 */
export function useVariantDeleteAction(
  variantId: string,
  options?: UseVariantDeleteActionOptions,
): {
  deleteDisabled: boolean
  deleteDisabledTooltip: string | undefined
  handleCloseDeleteDialog: () => void
  handleConfirmDelete: () => Promise<void>
  handleDelete: () => void
  isDeleteDialogOpen: boolean
  isDeleting: boolean
  variantTitle: string
} {
  const {documentCount, documentsLoading = false, onDeleted, variantTitle = ''} = options ?? {}
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {deleteVariant} = useVariantOperations()
  const {checkWithPermissionGuard} = useVariantPermissions()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // `null` until the dry run has answered; the store shares one request across every menu.
  const hasDeletePermission = useObservable(
    useMemo(
      () => defer(() => checkWithPermissionGuard(deleteVariant, variantId)),
      [checkWithPermissionGuard, deleteVariant, variantId],
    ),
    null,
  )

  const hasDocuments = typeof documentCount === 'number' && documentCount > 0
  const countUnknown = documentsLoading || documentCount === undefined || documentCount === null
  const canDelete = !countUnknown && !hasDocuments && hasDeletePermission === true

  const deleteDisabled = isDeleting || !canDelete

  const formatContainsDocumentsHint = useCallback(
    (count: number) =>
      t(
        count === 1
          ? 'overview.action.delete-variant.disabled-hint_one'
          : 'overview.action.delete-variant.disabled-hint_other',
        {count},
      ),
    [t],
  )

  const deleteDisabledTooltip = useMemo(() => {
    if (hasDeletePermission === false) {
      return t('overview.action.delete-variant.permission-error')
    }

    if (!hasDocuments || typeof documentCount !== 'number') {
      return undefined
    }

    return formatContainsDocumentsHint(documentCount)
  }, [documentCount, formatContainsDocumentsHint, hasDeletePermission, hasDocuments, t])

  const handleDelete = useCallback(() => {
    if (!canDelete) {
      return
    }

    setIsDeleteDialogOpen(true)
  }, [canDelete])

  const handleCloseDeleteDialog = useCallback(() => {
    if (isDeleting) {
      return
    }

    setIsDeleteDialogOpen(false)
  }, [isDeleting])

  // The client-side count can trail the server (another user may have just added a document to
  // this definition), so map the two refusals the server can answer with back to the copy the
  // disabled menu item would have shown.
  const getDeleteErrorDescription = useCallback(
    (error: unknown): string | undefined => {
      const referencingDocumentCount = getReferencingDocumentCount(error)
      if (referencingDocumentCount !== undefined) {
        return formatContainsDocumentsHint(referencingDocumentCount)
      }

      if (isInsufficientPermissionsError(error)) {
        return t('overview.action.delete-variant.permission-error')
      }

      return undefined
    },
    [formatContainsDocumentsHint, t],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!canDelete) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteVariant(variantId)
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      onDeleted?.()
    } catch (error) {
      console.error(error)
      toast.push({
        closable: true,
        status: 'error',
        title: t('overview.action.delete-variant.error.title'),
        description: getDeleteErrorDescription(error),
      })
      setIsDeleting(false)
    }
  }, [canDelete, deleteVariant, getDeleteErrorDescription, onDeleted, t, toast, variantId])

  return {
    deleteDisabled,
    deleteDisabledTooltip,
    handleCloseDeleteDialog,
    handleConfirmDelete,
    handleDelete,
    isDeleteDialogOpen,
    isDeleting,
    variantTitle,
  }
}
