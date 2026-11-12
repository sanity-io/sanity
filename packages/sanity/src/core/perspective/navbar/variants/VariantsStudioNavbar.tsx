import {useCallback} from 'react'

import {VariantMark} from '../../../../ui-components/variantMark'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useVariantTypes} from '../../../variants/hooks/useVariantConditions'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {getVariantId, getVariantTitle} from '../../../variants/tool/util'
import {type SystemVariant} from '../../../variants/types'
import {type VariantSelection} from '../../../variants/util/variantSelection'
import {DEFAULT_VARIANT_TYPE_KEY, variantTypeLabel} from '../../../variants/util/variantType'
import {useSetVariant} from '../../useSetVariant'
import {GlobalPerspectiveButton} from '../GlobalPerspectiveButton'
import {VariantsMenu} from './VariantsMenu'

function VariantTypeFilter(props: {
  fullWidth?: boolean
  selectedId: string | undefined
  typeKey: string
  /** The type's navbar label ("Variant" unless configured), which names the chip's picker */
  typeLabel: string
  variants: SystemVariant[]
}) {
  const {fullWidth, selectedId, typeKey, typeLabel, variants} = props
  const {t} = useTranslation()
  const setVariant = useSetVariant()
  const selectedVariant = selectedId
    ? variants.find((variant) => getVariantId(variant._id) === selectedId)
    : undefined
  const variantLabel = selectedVariant
    ? getVariantTitle(selectedVariant)
    : t('navbar.variant.default')
  const handleClear = useCallback(() => {
    setVariant({type: typeKey, variantId: undefined})
  }, [setVariant, typeKey])

  return (
    <VariantsMenu
      allowCreate={!fullWidth}
      typeKey={typeKey}
      trigger={
        <GlobalPerspectiveButton
          data-testid={
            typeKey === DEFAULT_VARIANT_TYPE_KEY
              ? 'variants-nav-menu-button'
              : `variants-nav-menu-button-${typeKey}`
          }
          fullWidth={fullWidth}
          handleClearPerspective={selectedId ? handleClear : undefined}
          // The small diamond, at the scale of the release dots in the perspective chip beside it
          icon={<VariantMark size="inline" />}
          pickerLabel={typeLabel}
          text={variantLabel}
        />
      }
    />
  )
}

/** The filters of the perspective bar; `VariantsStudioNavbarLayout` owns the bar itself */
export default function VariantsStudioNavbar({
  fullWidth,
  variantSelections,
}: {
  fullWidth?: boolean
  variantSelections: VariantSelection[]
}) {
  const {data: variants} = useAllVariants()
  const variantTypes = useVariantTypes()

  const resolvedTypes = variantTypes.status === 'ready' ? variantTypes.types : []
  const navbarTypes: {key: string; label?: string}[] =
    resolvedTypes.length > 0 ? resolvedTypes : [{key: DEFAULT_VARIANT_TYPE_KEY}]

  return navbarTypes.map((type) => (
    <VariantTypeFilter
      fullWidth={fullWidth}
      key={type.key}
      selectedId={variantSelections.find((selection) => selection.type === type.key)?.name}
      typeKey={type.key}
      typeLabel={variantTypeLabel(type.key, type.label)}
      variants={variants}
    />
  ))
}
