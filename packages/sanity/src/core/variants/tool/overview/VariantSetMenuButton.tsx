import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {TrashIcon} from '@sanity/icons/Trash'
import {Menu, MenuDivider} from '@sanity/ui'
import {useState} from 'react'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {DeleteVariantSetDialog} from '../../components/dialog/DeleteVariantSetDialog'
import {EditVariantSetDialog} from '../../components/dialog/EditVariantSetDialog'
import {variantsLocaleNamespace} from '../../i18n'
import {type VariantSetReference} from '../../util/variantSet'

/**
 * Actions menu for a variant set's aggregate row in the overview: edit or delete the whole set.
 *
 * @internal
 */
export function VariantSetMenuButton({
  setReference,
}: {
  setReference: VariantSetReference
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [isEditSetDialogOpen, setIsEditSetDialogOpen] = useState(false)
  const [isDeleteSetDialogOpen, setIsDeleteSetDialogOpen] = useState(false)

  return (
    <>
      <MenuButton
        button={<ContextMenuButton />}
        id={`variant-set-actions-${setReference.id}`}
        menu={
          <Menu>
            <MenuItem
              icon={BlockElementIcon}
              onClick={() => setIsEditSetDialogOpen(true)}
              text={t('overview.action.edit-variant-set')}
            />
            <MenuDivider />
            <MenuItem
              icon={TrashIcon}
              onClick={() => setIsDeleteSetDialogOpen(true)}
              text={t('overview.action.delete-variant-set')}
              tone="critical"
            />
          </Menu>
        }
        popover={{placement: 'bottom-end', portal: true}}
      />
      {isEditSetDialogOpen && (
        <EditVariantSetDialog
          onCancel={() => setIsEditSetDialogOpen(false)}
          onDone={() => setIsEditSetDialogOpen(false)}
          setReference={setReference}
        />
      )}
      {isDeleteSetDialogOpen && (
        <DeleteVariantSetDialog
          onClose={() => setIsDeleteSetDialogOpen(false)}
          onDone={() => setIsDeleteSetDialogOpen(false)}
          setReference={setReference}
        />
      )}
    </>
  )
}
