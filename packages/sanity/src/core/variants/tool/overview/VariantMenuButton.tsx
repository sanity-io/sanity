import {Menu} from '@sanity/ui'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {DeleteVariantDialog} from '../../components/dialog/DeleteVariantDialog'
import {useVariantDeleteAction} from '../../hooks/useVariantDeleteAction'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId, getVariantTitle} from '../util'

export function VariantMenuButton({
  documentCount,
  variant,
}: {
  documentCount?: number | null
  variant: SystemVariant
}) {
  const {t} = useTranslation(variantsLocaleNamespace)
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
  } = useVariantDeleteAction(variant._id, {documentCount, variantTitle})

  return (
    <>
      <MenuButton
        button={<ContextMenuButton disabled={isDeleting} loading={isDeleting} />}
        id={`variant-actions-${getVariantId(variant._id)}`}
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
