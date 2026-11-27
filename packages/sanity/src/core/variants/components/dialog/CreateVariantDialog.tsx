import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {
  VariantDefinitionCreated,
  type VariantDefinitionCreatedLocation,
} from '../../__telemetry__/variants.telemetry'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantDefaults} from '../../util/variantDefaults'
import {getVariantType} from '../../util/variantType'
import {VariantDialog} from './VariantDialog'

interface CreateVariantDialogProps {
  /** Where the dialog was opened from, reported with the created definition */
  location: VariantDefinitionCreatedLocation
  onCancel: () => void
  onSubmit: (createdVariantId: string, type: string) => void
  /** Variant type key written into the new definition. Defaults to `variant`. */
  type?: string
}

export function CreateVariantDialog(props: CreateVariantDialogProps): React.JSX.Element {
  const {location, onCancel, onSubmit, type} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const telemetry = useTelemetry()
  const {createVariant} = useVariantOperations()
  const initialValue = useMemo(() => getVariantDefaults(type), [type])

  const handleSubmit = useCallback(
    async (variant: typeof initialValue) => {
      await createVariant(variant)
      telemetry.log(VariantDefinitionCreated, {
        location,
        conditionCount: Object.keys(variant.conditions).length,
      })
      onSubmit(variant._id, getVariantType(variant))
    },
    [createVariant, location, onSubmit, telemetry],
  )

  return (
    <VariantDialog
      confirmDataTestId="submit-variant-button"
      confirmText={t('dialog.create.action.confirm')}
      errorTitle={t('dialog.create.error.title')}
      header={t('dialog.create.title')}
      id="create-variant-dialog"
      initialValue={initialValue}
      onCancel={onCancel}
      onSubmit={handleSubmit}
    />
  )
}
