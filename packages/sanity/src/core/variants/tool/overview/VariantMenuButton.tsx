import {Menu} from '@sanity/ui'
import {useCallback} from 'react'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId} from '../util'

export function VariantMenuButton({variant}: {variant: SystemVariant}) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const handleDelete = useCallback(() => undefined, [])

  return (
    <MenuButton
      button={<ContextMenuButton />}
      id={`variant-actions-${getVariantId(variant._id)}`}
      menu={
        <Menu>
          <MenuItem
            onClick={handleDelete}
            text={t('overview.action.delete-variant')}
            tone="critical"
          />
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}
