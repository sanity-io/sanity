import {type ComponentType} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {type TFunction} from '../../../i18n/types'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {useReleasesEnabled} from '../../../releases/hooks/useReleasesEnabled'
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
  /** Whether the drafts option reads as Published: drafts are off, so the variant is published. */
  targetsPublished?: boolean
  value: CreateVariantBundleOption | undefined
  onChange: (bundleKey: string) => void
  disabled: boolean
}

/** "Add to": the draft or release the variant is created in. */
export const SelectBundle: ComponentType<Props> = ({
  bundles,
  draftsTaken = false,
  targetsPublished = false,
  value,
  onChange,
  disabled,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const releasesEnabled = useReleasesEnabled()
  // The help names only what this studio offers: no releases when releases are off, Published
  // instead of a draft when drafts are off.
  const infoText = targetsPublished
    ? releasesEnabled
      ? t('document-group.create-variant.form.target-info-published')
      : t('document-group.create-variant.form.target-info-published-no-releases')
    : releasesEnabled
      ? t('document-group.create-variant.form.target-info')
      : t('document-group.create-variant.form.target-info-no-releases')
  const options = [
    ...(draftsTaken
      ? [
          {
            ...toOption({type: 'drafts'}, t, targetsPublished),
            disabled: true,
            subtitle: targetsPublished
              ? t('document-group.create-variant.form.published-taken')
              : t('document-group.create-variant.form.drafts-taken'),
          },
        ]
      : []),
    ...bundles.map((bundle) => toOption(bundle, t, targetsPublished)),
  ]

  return (
    <CreateVariantPicker
      label={t('document-group.create-variant.form.target-label')}
      info={{
        text: infoText,
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
      value={typeof value === 'undefined' ? undefined : toOption(value, t, targetsPublished)}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

function toOption(
  bundle: CreateVariantBundleOption,
  t: TFunction,
  targetsPublished: boolean,
): CreateVariantPickerOption {
  const icon =
    bundle.type === 'drafts' ? (
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
      <ReleaseAvatarIcon release={targetsPublished ? 'published' : 'drafts'} />
    ) : (
      <ReleaseAvatarIcon release={bundle.release} />
    )

  return {
    key: getBundleKey(bundle),
    text:
      bundle.type === 'drafts'
        ? targetsPublished
          ? t('release.chip.published')
          : t('release.chip.global.drafts')
        : bundle.release.metadata.title || t('release.placeholder-untitled-release'),
    icon,
    selectIcon: <TrimmedGlyph>{icon}</TrimmedGlyph>,
  }
}
