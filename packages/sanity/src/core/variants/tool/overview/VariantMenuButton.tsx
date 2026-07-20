import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {EditIcon} from '@sanity/icons/Edit'
import {TrashIcon} from '@sanity/icons/Trash'
import {Menu, MenuDivider} from '@sanity/ui'
import {useState} from 'react'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {DeleteVariantDialog} from '../../components/dialog/DeleteVariantDialog'
import {EditVariantDialog} from '../../components/dialog/EditVariantDialog'
import {EditVariantSetDialog} from '../../components/dialog/EditVariantSetDialog'
import {useVariantDeleteAction} from '../../hooks/useVariantDeleteAction'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantSetReference} from '../../util/variantSet'
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
  const setReference = getVariantSetReference(variant)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditSetDialogOpen, setIsEditSetDialogOpen] = useState(false)
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
              icon={EditIcon}
              onClick={() => setIsEditDialogOpen(true)}
              text={t('overview.action.edit-variant')}
            />
            {setReference && (
              <MenuItem
                icon={BlockElementIcon}
                onClick={() => setIsEditSetDialogOpen(true)}
                text={t('overview.action.edit-variant-set')}
              />
            )}
            <MenuDivider />
            <MenuItem
              disabled={deleteDisabled}
              icon={TrashIcon}
              onClick={handleDelete}
              text={t('overview.action.delete-variant')}
              tone="critical"
              tooltipProps={deleteDisabledTooltip ? {content: deleteDisabledTooltip} : undefined}
            />
          </Menu>
        }
        popover={{placement: 'bottom-end', portal: true}}
      />
      {isEditDialogOpen && (
        <EditVariantDialog
          onCancel={() => setIsEditDialogOpen(false)}
          onSubmit={() => setIsEditDialogOpen(false)}
          variant={variant}
        />
      )}
      {isEditSetDialogOpen && setReference && (
        <EditVariantSetDialog
          onCancel={() => setIsEditSetDialogOpen(false)}
          onDone={() => setIsEditSetDialogOpen(false)}
          setReference={setReference}
        />
      )}
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
