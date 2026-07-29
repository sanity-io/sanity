import {AddIcon} from '@sanity/icons/Add'
import {EditIcon} from '@sanity/icons/Edit'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {DetailActionRail} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspective} from '../../../perspective/usePerspective'
import {EditVariantDialog} from '../../components/dialog/EditVariantDialog'
import {useVariantDocumentOperations} from '../../hooks/useVariantDocumentOperations'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {
  VariantAddDocumentDialog,
  type VariantAddDocumentSelection,
} from './VariantAddDocumentDialog'
import {VariantMenuButton} from './VariantMenuButton'

/**
 * The variant detail top-right action rail — the `DetailActionRail` shared with Releases.
 *
 * `Edit definition` is the prominent primary (a defined, always-visible affordance, not an inline
 * hover pencil), opening the existing {@link EditVariantDialog}. `Add document` sits beside it as a
 * lighter secondary: it personalizes a chosen document into this variant (a variant is a lens, so
 * membership comes from personalizing — see {@link VariantAddDocumentDialog}). It lives in the
 * always-visible rail rather than the table's command lane so it is reachable even when the variant
 * has no documents yet. Delete lives in the overflow `⋯` menu ({@link VariantMenuButton}).
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
  const toast = useToast()
  const {selectedPerspective} = usePerspective()
  const {createVariantDocument} = useVariantDocumentOperations()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDocumentOpen, setAddDocumentOpen] = useState(false)

  const handleAddDocument = useCallback(
    async (document: VariantAddDocumentSelection) => {
      try {
        await createVariantDocument({
          baseId: document._id,
          baseRevisionId: document._rev,
          variant,
          selectedPerspective,
        })
        toast.push({
          closable: true,
          status: 'success',
          title: t('detail.add-document.toast.success'),
        })
        setAddDocumentOpen(false)
      } catch {
        toast.push({
          closable: true,
          status: 'error',
          title: t('detail.add-document.toast.error'),
        })
      }
    },
    [createVariantDocument, selectedPerspective, t, toast, variant],
  )

  return (
    <>
      <DetailActionRail
        secondary={
          <Button
            data-testid="add-document-button"
            icon={AddIcon}
            mode="ghost"
            onClick={() => setAddDocumentOpen(true)}
            text={t('detail.add-document.action')}
          />
        }
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
      {addDocumentOpen && (
        <VariantAddDocumentDialog
          onClose={() => setAddDocumentOpen(false)}
          onSelect={handleAddDocument}
        />
      )}
    </>
  )
}
