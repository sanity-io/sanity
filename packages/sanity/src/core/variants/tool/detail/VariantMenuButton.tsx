import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {Menu} from '@sanity/ui'
import {useRouter} from 'sanity/router'

import {Button, MenuButton, MenuItem} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {DeleteVariantDialog} from '../../components/dialog/DeleteVariantDialog'
import {useVariantDeleteAction} from '../../hooks/useVariantDeleteAction'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantTitle} from '../util'

/**
 * The variant detail overflow (`⋯`) menu — the `menu` slot of the shared {@link DetailActionRail}.
 *
 * Delete lives here (critical) rather than as its own top-level button, so the variant detail's
 * action rail matches the Releases rail's shape (primary + `⋯`). Delete is disabled while the
 * variant still contains documents (with an explanatory hint), reusing {@link useVariantDeleteAction}
 * for the confirm flow. Future variant-level actions (duplicate, add-to-release) land here too.
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
