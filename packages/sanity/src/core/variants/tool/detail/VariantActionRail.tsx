import {EditIcon} from '@sanity/icons/Edit'
import {useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {DetailActionRail} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {EditVariantDialog} from '../../components/dialog/EditVariantDialog'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {VariantMenuButton} from './VariantMenuButton'

/**
 * The variant detail top-right action rail — the `DetailActionRail` shared with Releases. Scoped to
 * the variant *definition*: `Edit definition` (primary) opens {@link EditVariantDialog}; Delete lives
 * in the overflow `⋯` menu ({@link VariantMenuButton}). Adding documents is a *table* action, not a
 * definition action, so it lives on the documents table (command lane + empty state), not here.
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
