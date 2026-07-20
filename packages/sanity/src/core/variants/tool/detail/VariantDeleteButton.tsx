import {TrashIcon} from '@sanity/icons/Trash'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {DeleteVariantDialog} from '../../components/dialog/DeleteVariantDialog'
import {useVariantDeleteAction} from '../../hooks/useVariantDeleteAction'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantTitle} from '../util'

/**
 * Delete control for the variant detail header. A bleed trash icon button (with a confirm dialog)
 * rather than an overflow menu: the variant definition's only header action besides Edit is Delete,
 * so a dedicated icon keeps the header a clean pair of icon buttons and avoids a "⋯" menu competing
 * with the documents' bulk-action "⋯" below.
 */
export function VariantDeleteButton({
  documentCount,
  documentsLoading = false,
  variant,
}: {
  documentCount: number
  documentsLoading?: boolean
  variant: SystemVariant
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const router = useRouter()
  const variantTitle = getVariantTitle(variant)
  const {
    deleteDisabled,
    deleteDisabledTooltip,
    handleCloseDeleteDialog,
    handleConfirmDelete,
    handleDelete,
    isDeleteDialogOpen,
    isDeleting,
    variantTitle: dialogVariantTitle,
  } = useVariantDeleteAction(variant._id, {
    documentCount,
    documentsLoading,
    onDeleted: () => router.navigate({}),
    variantTitle,
  })

  return (
    <>
      <Button
        aria-label={t('overview.action.delete-variant')}
        disabled={deleteDisabled || isDeleting}
        icon={TrashIcon}
        loading={isDeleting}
        mode="bleed"
        onClick={handleDelete}
        tone="critical"
        tooltipProps={{content: deleteDisabledTooltip || t('overview.action.delete-variant')}}
      />
      {isDeleteDialogOpen && (
        <DeleteVariantDialog
          isDeleting={isDeleting}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          variantTitle={dialogVariantTitle}
        />
      )}
    </>
  )
}
