import {type ReleaseDocument} from '@sanity/client'
import DocumentsIcon from '@sanity/icons/Documents'
import {type ComponentType, useContext} from 'react'
import {CreateVariantFormContext} from 'sanity/_singletons'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {isAgentBundleName} from '../../../store/agent/createAgentBundlesStore'
import {getVersionFromId} from '../../../util/draftUtils'
import {readVersionType} from '../../../util/versionsUtils'
import {type VariantSet} from '../../machines/documentGroupInventoryMachine'
import {CreateVariantPicker, type CreateVariantPickerOption} from './CreateVariantPicker'

interface Props {
  /** The document group's versions, in the sets the inventory lists them in. */
  sets: VariantSet[]
  releases: ReadonlyMap<string, ReleaseDocument>
  /** The picked version, or `undefined` for the nearest version. */
  value: VersionInfoDocumentStub | undefined
  /** Called with the picked version's id, or `undefined` when the nearest version is picked. */
  onChange: (versionId: string | undefined) => void
  disabled: boolean
  /** PROPOSED: the name of the draft or release the variant is added to; the inset form's nearest version row says it copies from Default there. */
  targetText?: string
}

const NEAREST_VERSION_KEY = '#nearest-version'

export const SelectBaseVersion: ComponentType<Props> = ({
  sets,
  releases,
  value,
  onChange,
  disabled,
  targetText,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const inset = useContext(CreateVariantFormContext) === 'final'

  // The agent's proposed changes are not offered as a version to start from.
  const options = sets.flatMap((set) =>
    set.variants
      .filter(({document}) => !isAgentBundleName(getVersionFromId(document._id)))
      .map<CreateVariantPickerOption>((version) => ({
        key: version.id,
        text: t('document-group.create-variant.base-option', {
          variantName: version.name,
          bundleName: set.name,
        }),
        icon: <VersionIcon document={version.document} releases={releases} />,
      })),
  )

  const nearestVersionOption: CreateVariantPickerOption = {
    key: NEAREST_VERSION_KEY,
    text: t('document-group.create-variant.base-option-nearest'),
    subtitle: targetText
      ? t('document-group.create-variant.form.nearest-subtitle', {target: targetText})
      : undefined,
  }

  return (
    <CreateVariantPicker
      icon={DocumentsIcon}
      label={t(
        inset
          ? 'document-group.create-variant.form.base-label'
          : 'document-group.create-variant.base-label',
      )}
      description={t('document-group.create-variant.base-description')}
      testId="create-variant-base-menu"
      placeholder={inset ? t('document-group.create-variant.base-option-nearest') : undefined}
      emptyIcon={<DocumentsIcon />}
      leadingOptions={[nearestVersionOption]}
      options={options}
      value={
        typeof value === 'undefined'
          ? nearestVersionOption
          : options.find((option) => option.key === value._id)
      }
      onChange={(key) => onChange(key === NEAREST_VERSION_KEY ? undefined : key)}
      disabled={disabled}
    />
  )
}

const VersionIcon: ComponentType<{
  document: VersionInfoDocumentStub
  releases: ReadonlyMap<string, ReleaseDocument>
}> = ({document, releases}) => {
  switch (readVersionType(document)) {
    case 'draft':
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
      return <ReleaseAvatarIcon release="drafts" />
    case 'published':
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
      return <ReleaseAvatarIcon release="published" />
    case 'release': {
      const release = releases.get(document._system.release?._ref ?? '')
      return release ? <ReleaseAvatarIcon release={release} /> : null
    }
    default:
      return null
  }
}
