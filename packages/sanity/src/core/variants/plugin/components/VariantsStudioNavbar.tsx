import {CSSProperties, useCallback} from 'react'

import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {GlobalPerspectiveButton} from '../../../perspective/navbar/GlobalPerspectiveButton'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {useVariantTypes} from '../../hooks/useVariantConditions'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {type VariantSelection} from '../../util/variantSelection'
import {DEFAULT_VARIANT_TYPE_KEY} from '../../util/variantType'
import {VariantsMenu} from './VariantsMenu'
import {suggestIconColor} from './VariantsNav.css'

function VariantTypeFilter(props: {
  selectedId: string | undefined
  typeKey: string
  variants: SystemVariant[]
}) {
  const {selectedId, typeKey, variants} = props
  const {t} = useTranslation(variantsLocaleNamespace)
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
      typeKey={typeKey}
      trigger={
        <GlobalPerspectiveButton
          data-testid={
            typeKey === DEFAULT_VARIANT_TYPE_KEY
              ? 'variants-nav-menu-button'
              : `variants-nav-menu-button-${typeKey}`
          }
          handleClearPerspective={selectedId ? handleClear : undefined}
          icon={<RhombusIcon className={suggestIconColor} />}
          text={variantLabel}
        />
      }
    />
  )
}

/** The filters of the perspective bar; `VariantsStudioNavbarLayout` owns the bar itself */
export default function VariantsStudioNavbar({
  variantSelections,
}: {
  variantSelections: VariantSelection[]
}) {
  const {data: variants} = useAllVariants()
  const variantTypes = useVariantTypes()

  const resolvedTypes = variantTypes.status === 'ready' ? variantTypes.types : []
  const navbarTypes = resolvedTypes.length > 0 ? resolvedTypes : [{key: DEFAULT_VARIANT_TYPE_KEY}]

  return navbarTypes.map((type) => (
    <VariantTypeFilter
      key={type.key}
      selectedId={variantSelections.find((selection) => selection.type === type.key)?.name}
      typeKey={type.key}
      variants={variants}
    />
  ))
}
