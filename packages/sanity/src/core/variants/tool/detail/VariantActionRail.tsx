import {EditIcon} from '@sanity/icons/Edit'
import {useState} from 'react'

import {Button} from '../../../../ui-components'
import {DetailActionRail} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n'
import {EditVariantDialog} from '../../components/dialog/EditVariantDialog'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {VariantMenuButton} from './VariantMenuButton'

/**
 * The variant detail top-right action rail — the `DetailActionRail` shared with Releases.
 *
 * `Edit definition` is the prominent primary (a defined, always-visible affordance, not an inline
 * hover pencil), opening the existing {@link EditVariantDialog} which edits name + description +
 * conditions. Delete lives in the overflow `⋯` menu ({@link VariantMenuButton}), critical-toned.
 *
 * @internal
 */
export function VariantActionRail({
  documentCount,
  documentsLoading,
  variant,
}: {
  documentCount: number
  documentsLoading: boolean
  variant: SystemVariant
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  return (
    <>
      <DetailActionRail
        primary={
          <Button
            data-testid="edit-variant-button"
            icon={EditIcon}
            mode="default"
            onClick={() => setEditDialogOpen(true)}
            text={t('detail.action.edit-definition')}
          />
        }
        menu={
          <VariantMenuButton
            documentCount={documentCount}
            documentsLoading={documentsLoading}
            variant={variant}
          />
        }
      />
      {editDialogOpen && (
        <EditVariantDialog
          onCancel={() => setEditDialogOpen(false)}
          onSubmit={() => setEditDialogOpen(false)}
          variant={variant}
        />
      )}
    </>
  )
}
