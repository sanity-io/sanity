import {Text} from '@sanity/ui'

import {Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'

interface DeleteVariantDialogProps {
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
  variantTitle: string
}

export function DeleteVariantDialog({
  isDeleting,
  onClose,
  onConfirm,
  variantTitle,
}: DeleteVariantDialogProps): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)

  return (
    <Dialog
      data-testid="delete-variant-dialog"
      footer={{
        cancelButton: {
          disabled: isDeleting,
        },
        confirmButton: {
          disabled: isDeleting,
          loading: isDeleting,
          onClick: onConfirm,
          text: t('dialog.delete.action.confirm'),
          tone: 'critical',
        },
      }}
      header={t('dialog.delete.title')}
      id="delete-variant-dialog"
      onClose={isDeleting ? undefined : onClose}
    >
      <Text muted size={1}>
        {t('dialog.delete.description', {title: variantTitle})}
      </Text>
    </Dialog>
  )
}
