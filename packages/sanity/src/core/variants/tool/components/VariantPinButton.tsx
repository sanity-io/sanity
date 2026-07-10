import {PinIcon} from '@sanity/icons/Pin'
import {PinFilledIcon} from '@sanity/icons/PinFilled'
import {useCallback} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantTitle} from '../util'

export function VariantPinButton({
  variant,
  'data-testid': dataTestId = 'pin-variant-button',
}: {
  'variant': SystemVariant
  'data-testid'?: string
}) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {selectedVariant} = usePerspective()
  const setVariant = useSetVariant()

  const isPinned = selectedVariant?._id === variant._id
  const variantTitle = getVariantTitle(variant)

  const handlePinVariant = useCallback(() => {
    if (isPinned) {
      setVariant(undefined)
    } else {
      setVariant(variant)
    }
  }, [isPinned, setVariant, variant])

  return (
    <Button
      aria-label={
        isPinned
          ? `${t('detail.unpin-variant')}: "${variantTitle}"`
          : `${t('detail.pin-variant')}: "${variantTitle}"`
      }
      aria-live="assertive"
      data-testid={dataTestId}
      icon={isPinned ? PinFilledIcon : PinIcon}
      mode="bleed"
      onClick={handlePinVariant}
      radius="full"
      selected={isPinned}
      tooltipProps={{
        content: isPinned ? t('detail.unpin-variant') : t('detail.pin-variant'),
      }}
    />
  )
}
