import {Menu} from '@sanity/ui'
import {useRouter} from 'sanity/router'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {DeleteVariantDialog} from '../../components/dialog/DeleteVariantDialog'
import {useVariantDeleteAction} from '../../hooks/useVariantDeleteAction'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId, getVariantTitle} from '../util'

export function VariantDetailMenuButton({
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
      <MenuButton
        button={<ContextMenuButton disabled={isDeleting} loading={isDeleting} />}
        id={`variant-detail-actions-${getVariantId(variant._id)}`}
        menu={
          <Menu>
            <MenuItem
              disabled={deleteDisabled}
              onClick={handleDelete}
              text={t('overview.action.delete-variant')}
              tone="critical"
              tooltipProps={deleteDisabledTooltip ? {content: deleteDisabledTooltip} : undefined}
            />
          </Menu>
        }
        popover={{placement: 'bottom-end', portal: true}}
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
