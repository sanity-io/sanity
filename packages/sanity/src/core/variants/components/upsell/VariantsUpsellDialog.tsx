import {Text} from 'ui5'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'

/**
 * Placeholder upsell dialog for the create actions. To be replaced by `UpsellDialog` once the
 * content variants upsell content is published.
 *
 * @internal
 */
export function VariantsUpsellDialog({onClose}: {onClose: () => void}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)

  return (
    <Dialog
      data-testid="variants-upsell-dialog"
      header={t('upsell.dialog.title')}
      id="variants-upsell-dialog"
      onClickOutside={onClose}
      onClose={onClose}
    >
      <Text muted size={1} as="div">
        {t('upsell.dialog.description')}
      </Text>
    </Dialog>
  )
}
