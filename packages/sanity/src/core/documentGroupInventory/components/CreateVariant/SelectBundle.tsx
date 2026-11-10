import {PackageIcon} from '@sanity/icons/Package'
import {type ComponentType} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {type TFunction} from '../../../i18n/types'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {CreateVariantPicker, type CreateVariantPickerOption} from './CreateVariantPicker'
import {type CreateVariantBundleOption, getBundleKey} from './getAvailableBundles'

interface Props {
  bundles: CreateVariantBundleOption[]
  value: CreateVariantBundleOption | undefined
  onChange: (bundleKey: string) => void
  disabled: boolean
}

export const SelectBundle: ComponentType<Props> = ({bundles, value, onChange, disabled}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const options = bundles.map((bundle) => toOption(bundle, t))

  return (
    <CreateVariantPicker
      icon={PackageIcon}
      label={t('document-group.create-variant.target-label')}
      description={t('document-group.create-variant.target-description')}
      testId="create-variant-target-menu"
      options={options}
      value={typeof value === 'undefined' ? undefined : toOption(value, t)}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

function toOption(bundle: CreateVariantBundleOption, t: TFunction): CreateVariantPickerOption {
  if (bundle.type === 'drafts') {
    return {
      key: getBundleKey(bundle),
      text: t('release.chip.global.drafts'),
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
      icon: <ReleaseAvatarIcon release="drafts" />,
    }
  }

  return {
    key: getBundleKey(bundle),
    text: bundle.release.metadata.title || t('release.placeholder-untitled-release'),
    icon: <ReleaseAvatarIcon release={bundle.release} />,
  }
}
