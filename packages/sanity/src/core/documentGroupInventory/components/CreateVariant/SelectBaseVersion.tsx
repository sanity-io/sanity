import {type ReleaseDocument} from '@sanity/client'
import DocumentsIcon from '@sanity/icons/Documents'
import {type ComponentType} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {isAgentBundleName} from '../../../store/agent/createAgentBundlesStore'
import {getVersionFromId} from '../../../util/draftUtils'
import {readVersionType} from '../../../util/versionsUtils'
import {type VariantSet} from '../../machines/documentGroupInventoryMachine'
import {
  CreateVariantPicker,
  type CreateVariantPickerOption,
  TrimmedGlyph,
} from './CreateVariantPicker'

interface Props {
  /** The document group's versions, in the sets the inventory lists them in. */
  sets: VariantSet[]
  releases: ReadonlyMap<string, ReleaseDocument>
  /** The picked version, or `undefined` for the nearest version. */
  value: VersionInfoDocumentStub | undefined
  /** Called with the picked version's id, or `undefined` when the nearest version is picked. */
  onChange: (versionId: string | undefined) => void
  disabled: boolean
  /**
   * The version "Nearest version" resolves to for the picked variant and bundle, named on the
   * second line of its menu row. `undefined` when there is none and the variant starts empty.
   */
  nearestBase?: {variantName: string; bundleName: string}
}

const NEAREST_VERSION_KEY = '#nearest-version'

export const SelectBaseVersion: ComponentType<Props> = ({
  sets,
  releases,
  value,
  onChange,
  disabled,
  nearestBase,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)

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
        selectIcon: (
          <TrimmedGlyph>
            <VersionIcon document={version.document} releases={releases} />
          </TrimmedGlyph>
        ),
      })),
  )

  const nearestVersionOption: CreateVariantPickerOption = {
    key: NEAREST_VERSION_KEY,
    text: t('document-group.create-variant.base-option-nearest'),
    icon: DocumentsIcon,
    selectIcon: <DocumentsGlyph />,
    subtitle: nearestBase
      ? t('document-group.create-variant.form.nearest-subtitle', nearestBase)
      : t('document-group.create-variant.form.nearest-subtitle-empty'),
  }

  return (
    <CreateVariantPicker
      label={t('document-group.create-variant.form.base-label')}
      testId="create-variant-base-menu"
      emptyIcon={<DocumentsGlyph />}
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

function DocumentsGlyph() {
  return (
    <TrimmedGlyph>
      <DocumentsIcon />
    </TrimmedGlyph>
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
      return release ? <ReleaseAvatarIcon release={release} /> : <DocumentsIcon />
    }
    default:
      return <DocumentsIcon />
  }
}
