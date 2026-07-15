import {Menu} from '@sanity/ui'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {useVariantDeleteAction} from '../../hooks/useVariantDeleteAction'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId} from '../util'

export function VariantMenuButton({
  documentCount,
  variant,
}: {
  documentCount?: number | null
  variant: SystemVariant
}) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {deleteDisabled, deleteDisabledTooltip, handleDelete, isDeleting} = useVariantDeleteAction(
    variant._id,
    {documentCount},
  )

  return (
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
  )
}
