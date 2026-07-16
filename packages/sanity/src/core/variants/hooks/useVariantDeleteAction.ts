import {useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {useTranslation} from '../../i18n'
import {variantsLocaleNamespace} from '../i18n'
import {useVariantOperations} from '../store/useVariantOperations'

interface UseVariantDeleteActionOptions {
  documentCount?: number | null
  documentsLoading?: boolean
  onDeleted?: () => void
  variantTitle?: string
}

/**
 * Shared delete action state for variant menu buttons.
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const hasDocuments = typeof documentCount === 'number' && documentCount > 0
  const countUnknown = documentsLoading || documentCount === undefined || documentCount === null

  const deleteDisabled = isDeleting || countUnknown || hasDocuments

  const deleteDisabledTooltip = useMemo(() => {
    if (!hasDocuments || typeof documentCount !== 'number') {
      return undefined
    }

    return t(
      documentCount === 1
        ? 'overview.action.delete-variant.disabled-hint_one'
        : 'overview.action.delete-variant.disabled-hint_other',
      {count: documentCount},
    )
  }, [documentCount, hasDocuments, t])

  const handleDelete = useCallback(() => {
    if (countUnknown || hasDocuments) {
      return
    }

    setIsDeleteDialogOpen(true)
  }, [countUnknown, hasDocuments])

  const handleCloseDeleteDialog = useCallback(() => {
    if (isDeleting) {
      return
    }

    setIsDeleteDialogOpen(false)
  }, [isDeleting])

  const handleConfirmDelete = useCallback(async () => {
    if (countUnknown || hasDocuments) {
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
      })
      setIsDeleting(false)
    }
  }, [countUnknown, deleteVariant, hasDocuments, onDeleted, t, toast, variantId])

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
