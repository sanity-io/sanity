import {Menu, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {type SystemVariant} from '../../types'
import {getVariantId} from '../util'

export function VariantMenuButton({variant}: {variant: SystemVariant}) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const {deleteVariant} = useVariantOperations()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)

    try {
      await deleteVariant(variant._id)
      setIsDeleting(false)
    } catch (error) {
      console.error(error)
      toast.push({
        closable: true,
        status: 'error',
        title: t('overview.action.delete-variant.error.title'),
      })
      setIsDeleting(false)
    }
  }, [deleteVariant, t, toast, variant._id])

  return (
    <MenuButton
      button={<ContextMenuButton disabled={isDeleting} loading={isDeleting} />}
      id={`variant-actions-${getVariantId(variant._id)}`}
      menu={
        <Menu>
          <MenuItem
            // TODO: This action now doesn't validate the documents count in a variant, once we can
            // start adding documents to a variant we should revisit this to validate the documents count.
            // If it has documents we should probably disable the delete action or at least handle it differently.
            disabled={isDeleting}
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
