import {type ComponentType} from 'react'

import {VariantMark} from '../../../../ui-components/variantMark'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {getVariantTitle} from '../../../variants/tool/util'
import {type SystemVariant} from '../../../variants/types'
import {CreateVariantPicker, type CreateVariantPickerOption} from './CreateVariantPicker'

interface Props {
  variantDefinitions: SystemVariant[]
  value: SystemVariant | undefined
  onChange: (variantId: string) => void
  disabled: boolean
}

export const SelectVariantDefinition: ComponentType<Props> = ({
  variantDefinitions,
  value,
  onChange,
  disabled,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const options = variantDefinitions.map(toOption)

  return (
    <CreateVariantPicker
      icon={<VariantMark size="row" />}
      label={t('document-group.create-variant.variant-label')}
      description={t('document-group.create-variant.variant-description')}
      testId="create-variant-variant-menu"
      options={options}
      value={typeof value === 'undefined' ? undefined : toOption(value)}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

function toOption(variantDefinition: SystemVariant): CreateVariantPickerOption {
  return {
    key: variantDefinition._id,
    text: getVariantTitle(variantDefinition),
    icon: <VariantMark size="row" />,
  }
}
