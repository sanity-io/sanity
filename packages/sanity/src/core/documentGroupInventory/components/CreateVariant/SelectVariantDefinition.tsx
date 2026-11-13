import {clsx} from 'clsx'
import {type ComponentType, type RefAttributes, type SVGProps} from 'react'

import {RhombusIconLarge, RhombusOutlineIcon} from '../../../components/temporary-icons/Rhombus'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {getVariantTitle} from '../../../variants/tool/util'
import {type SystemVariant} from '../../../variants/types'
import {createVariantDefinitionIcon} from './CreateVariant.css'
import {CreateVariantPicker, type CreateVariantPickerOption} from './CreateVariantPicker'

interface Props {
  variantDefinitions: SystemVariant[]
  /** The definitions the document already has a version in; listed first, under their own heading. */
  existingVariantIds: ReadonlySet<string>
  value: SystemVariant | undefined
  onChange: (variantId: string) => void
  disabled: boolean
}

// As in the document's Variants pill menu: a filled diamond for a variant the document has a
// version in, an outline for one it has not, both in the variant colour.
// The menu item's `Icon` clones the icon with its own class, so the variant colour is merged with it.
type IconProps = SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>

function FilledVariantIcon(props: IconProps) {
  return (
    <RhombusIconLarge {...props} className={clsx(props.className, createVariantDefinitionIcon)} />
  )
}

function OutlineVariantIcon(props: IconProps) {
  return (
    <RhombusOutlineIcon {...props} className={clsx(props.className, createVariantDefinitionIcon)} />
  )
}

/**
 * The variant picker groups the definitions the way the Variants pill menu does: "Has N variants"
 * (a new version can still go to another draft or release), then "Other variants". There is no
 * Default row, since Default is not a variant one creates.
 */
export const SelectVariantDefinition: ComponentType<Props> = ({
  variantDefinitions,
  existingVariantIds,
  value,
  onChange,
  disabled,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const existing = variantDefinitions.filter(({_id}) => existingVariantIds.has(_id))
  const other = variantDefinitions.filter(({_id}) => !existingVariantIds.has(_id))

  return (
    <CreateVariantPicker
      icon={RhombusIconLarge}
      label={t('document-group.create-variant.variant-label')}
      description={t('document-group.create-variant.variant-description')}
      testId="create-variant-variant-menu"
      filterPlaceholder={t('document-group.create-variant.variant-filter-placeholder')}
      leadingOptions={existing.map((definition) => toOption(definition, true))}
      leadingLabel={t('document-group.create-variant.variant-section.has-variants', {
        count: existing.length,
      })}
      options={other.map((definition) => toOption(definition, false))}
      optionsLabel={
        existing.length > 0 ? t('document-group.create-variant.variant-section.other') : undefined
      }
      value={
        typeof value === 'undefined'
          ? undefined
          : toOption(value, existingVariantIds.has(value._id))
      }
      onChange={onChange}
      disabled={disabled}
    />
  )
}

function toOption(
  variantDefinition: SystemVariant,
  hasVersion: boolean,
): CreateVariantPickerOption {
  return {
    key: variantDefinition._id,
    text: getVariantTitle(variantDefinition),
    icon: hasVersion ? FilledVariantIcon : OutlineVariantIcon,
  }
}
