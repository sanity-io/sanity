import {type ComponentType} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {type TFunction} from '../../../i18n/types'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {
  CreateVariantPicker,
  type CreateVariantPickerOption,
  TrimmedGlyph,
} from './CreateVariantPicker'
import {type CreateVariantBundleOption, getBundleKey} from './getAvailableBundles'

interface Props {
  bundles: CreateVariantBundleOption[]
  /**
   * Whether the picked variant already has a draft. Drafts then stays first in the list, but
   * cannot be picked and says why, so it does not look as if Drafts went missing.
   */
  draftsTaken?: boolean
  value: CreateVariantBundleOption | undefined
  onChange: (bundleKey: string) => void
  disabled: boolean
}

/** "Add to": the draft or release the variant is created in. */
export const SelectBundle: ComponentType<Props> = ({
  bundles,
  draftsTaken = false,
  value,
  onChange,
  disabled,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const options = [
    ...(draftsTaken
      ? [
          {
            ...toOption({type: 'drafts'}, t),
            disabled: true,
            subtitle: t('document-group.create-variant.form.drafts-taken'),
          },
        ]
      : []),
    ...bundles.map((bundle) => toOption(bundle, t)),
  ]

  return (
    <CreateVariantPicker
      label={t('document-group.create-variant.form.target-label')}
      info={{
        text: t('document-group.create-variant.form.target-info'),
        label: t('document-group.create-variant.form.target-info-label'),
      }}
      testId="create-variant-target-menu"
      placeholder={t('document-group.create-variant.form.target-hint')}
      emptyIcon={
        <TrimmedGlyph>
          {/* oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users */}
          <ReleaseAvatarIcon release="drafts" />
        </TrimmedGlyph>
      }
      options={options}
      value={typeof value === 'undefined' ? undefined : toOption(value, t)}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

function toOption(bundle: CreateVariantBundleOption, t: TFunction): CreateVariantPickerOption {
  const icon =
    bundle.type === 'drafts' ? (
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
      <ReleaseAvatarIcon release="drafts" />
    ) : (
      <ReleaseAvatarIcon release={bundle.release} />
    )

  return {
    key: getBundleKey(bundle),
    text:
      bundle.type === 'drafts'
        ? t('release.chip.global.drafts')
        : bundle.release.metadata.title || t('release.placeholder-untitled-release'),
    icon,
    selectIcon: <TrimmedGlyph>{icon}</TrimmedGlyph>,
  }
}
