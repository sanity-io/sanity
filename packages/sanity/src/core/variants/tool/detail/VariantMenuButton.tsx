import {CopyIcon} from '@sanity/icons/Copy'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {DeleteVariantDialog} from '../../components/dialog/DeleteVariantDialog'
import {DuplicateVariantDialog} from '../../components/dialog/DuplicateVariantDialog'
import {useVariantDeleteAction} from '../../hooks/useVariantDeleteAction'
import {useVariantDuplicateAction} from '../../hooks/useVariantDuplicateAction'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantTitle} from '../util'

/**
 * The variant detail overflow (`⋯`) menu — the `menu` slot of the shared {@link DetailActionRail}.
 *
 * Duplicate and delete live here rather than as top-level buttons, so the variant detail's action
 * rail matches the Releases rail's shape (primary + `⋯`). Duplicate opens the prefilled create form
 * ({@link DuplicateVariantDialog}). Delete is critical-toned and disabled while the variant still
 * contains documents (with an explanatory hint), reusing {@link useVariantDeleteAction} for the
 * confirm flow. Future variant-level actions (add-to-release) land here too.
 *
 * @internal
 */
export function VariantMenuButton({
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
  const {handleCloseDuplicateDialog, handleDuplicate, handleDuplicated, isDuplicateDialogOpen} =
    useVariantDuplicateAction()

  return (
    <>
      <MenuButton
        id="variant-detail-menu"
        button={
          <Button
            aria-label={t('detail.menu.label')}
            icon={EllipsisHorizontalIcon}
            mode="bleed"
            tooltipProps={{content: t('detail.menu.label')}}
            data-testid="variant-detail-menu-button"
          />
        }
        menu={
          <Menu>
            <MenuItem
              data-testid="duplicate-variant-menu-item"
              icon={CopyIcon}
              onClick={handleDuplicate}
              text={t('overview.action.duplicate-variant')}
            />
            <MenuDivider />
            <MenuItem
              data-testid="delete-variant-menu-item"
              disabled={deleteDisabled || isDeleting}
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
      {isDuplicateDialogOpen && (
        <DuplicateVariantDialog
          documentCount={documentsLoading ? undefined : documentCount}
          onCancel={handleCloseDuplicateDialog}
          onDuplicated={handleDuplicated}
          variant={variant}
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
