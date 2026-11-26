import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {
  VariantDefinitionEdited,
  type VariantsToolLocation,
} from '../../__telemetry__/variants.telemetry'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {type EditableSystemVariant, type SystemVariant} from '../../types'
import {getVariantDefinitionChanges} from '../../util/getVariantDefinitionChanges'
import {VariantDialog} from './VariantDialog'

interface EditVariantDialogProps {
  /** The Variants tool page the dialog was opened from, reported with the edit */
  location: VariantsToolLocation
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
  const {location, onCancel, onSubmit, variant: initialVariant} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const telemetry = useTelemetry()
  const {updateVariant} = useVariantOperations()
  const initialValue = useMemo(() => toEditableVariant(initialVariant), [initialVariant])

  const handleSubmit = useCallback(
    async (variant: EditableSystemVariant) => {
      await updateVariant(variant)
      telemetry.log(VariantDefinitionEdited, {
        location,
        ...getVariantDefinitionChanges(initialValue, variant),
      })
      onSubmit()
    },
    [initialValue, location, onSubmit, telemetry, updateVariant],
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
      lockType
      renderCancelButton
    />
  )
}
