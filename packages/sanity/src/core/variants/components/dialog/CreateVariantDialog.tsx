import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantDefaults} from '../../util/variantDefaults'
import {getVariantType} from '../../util/variantType'
import {VariantDialog} from './VariantDialog'

interface CreateVariantDialogProps {
  onCancel: () => void
  onSubmit: (createdVariantId: string, type: string) => void
  /** Variant type key written into the new definition. Defaults to `variant`. */
  type?: string
}

export function CreateVariantDialog(props: CreateVariantDialogProps): React.JSX.Element {
  const {onCancel, onSubmit, type} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const {createVariant} = useVariantOperations()
  const initialValue = useMemo(() => getVariantDefaults(type), [type])

  const handleSubmit = useCallback(
    async (variant: typeof initialValue) => {
      await createVariant(variant)
      onSubmit(variant._id, getVariantType(variant))
    },
    [createVariant, onSubmit],
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
