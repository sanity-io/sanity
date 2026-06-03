import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {type EditableSystemVariant, type SystemVariant} from '../../types'
import {VariantDialog} from './VariantDialog'

interface EditVariantDialogProps {
  onCancel: () => void
  onSubmit: () => void
  variant: SystemVariant
}

function toEditableVariant(variant: SystemVariant): EditableSystemVariant {
  return {
    _id: variant._id,
    _type: variant._type,
    conditions: variant.conditions,
    priority: variant.priority,
    metadata: variant.metadata,
  }
}

export function EditVariantDialog(props: EditVariantDialogProps): React.JSX.Element {
  const {onCancel, onSubmit, variant: initialVariant} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const {updateVariant} = useVariantOperations()
  const initialValue = useMemo(() => toEditableVariant(initialVariant), [initialVariant])

  const handleSubmit = useCallback(
    async (variant: EditableSystemVariant) => {
      await updateVariant(variant)
      onSubmit()
    },
    [onSubmit, updateVariant],
  )

  return (
    <VariantDialog
      confirmDataTestId="save-variant-button"
      confirmText={t('dialog.edit.action.confirm')}
      errorTitle={t('dialog.edit.error.title')}
      header={t('dialog.edit.title')}
      id="edit-variant-dialog"
      initialValue={initialValue}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      renderCancelButton
    />
  )
}
