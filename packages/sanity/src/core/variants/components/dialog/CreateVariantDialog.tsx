import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {getVariantDefaults} from '../../util/variantDefaults'
import {VariantDialog} from './VariantDialog'

interface CreateVariantDialogProps {
  onCancel: () => void
  onSubmit: (createdVariantId: string) => void
}

export function CreateVariantDialog(props: CreateVariantDialogProps): React.JSX.Element {
  const {onCancel, onSubmit} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const {createVariant} = useVariantOperations()
  const initialValue = useMemo(() => getVariantDefaults(), [])

  const handleSubmit = useCallback(
    async (variant: typeof initialValue) => {
      await createVariant(variant)
      onSubmit(variant._id)
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
      showSetSelector
    />
  )
}
