import {type ReleaseDocument} from '@sanity/client'

import {type TFunction} from '../../i18n/types'
import {type VersionInfoDocumentStub} from '../../releases'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {getVersionFromId, type SystemBundle} from '../../util/draftUtils'
import {readVersionType} from '../../util/versionsUtils'
import {type SystemVariant} from '../../variants/types'
import {type Meta, type VariantSet} from '../machines/documentGroupInventoryMachine'
import {type Variant} from '../machines/selectionMachine'

/**
 * @internal
 */
export function computeSets({
  meta,
  current,
  t,
  variantsEnabled,
}: {
  meta: Meta | undefined
  current: VariantSet[]
  t: TFunction
  variantsEnabled: boolean | undefined
}): VariantSet[] {
  if (!meta) {
    return current
  }

  const {releases} = meta.releases
  const {variants} = meta.variants
  const userBundleIds = new Set(meta.agentBundles.bundles.map(({id}) => id))

  const proposedChangesId = meta.versionState.data.find((id) => {
    const bundleId = getVersionFromId(id)
    return typeof bundleId === 'string' && userBundleIds.has(bundleId)
  })

  if (!variantsEnabled) {
    const hasVariants = meta.versionState.versions.some(
      (version) => typeof version._system.variant !== 'undefined',
    )

    if (hasVariants) {
      console.warn(`Content Variants is switched off, but there are variants of this document.
Switch Content Variants on in your Studio configuration to ensure variants are displayed correctly (set \`beta.variants.enabled\` to \`true\`).`)
    }

    const variants: Variant[] = meta.versionState.versions
      .filter((version) => !isAgentBundleName(getVersionFromId(version._id)))
      .map<Variant>((version) => ({
        id: version._id,
        name: getVersionName({document: version, releases, t}),
        document: version,
      }))

    if (typeof proposedChangesId !== 'undefined') {
      variants.unshift({
        id: proposedChangesId,
        name: t('version.agent-bundle.proposed-changes'),
      })
    }

    return [
      {
        key: 'studio:all',
        name: t('document-group-inventory.title', {
          count: variants.length,
          subject: t('document-group.subject.version', {
            count: variants.length,
          }),
        }),
        variants,
      },
    ]
  }

  const variantsByRelease = meta.versionState.versions
    .filter((version) => !isAgentBundleName(getVersionFromId(version._id)))
    .reduce<Map<string, VersionInfoDocumentStub[]>>((currentVariantsByRelease, version) => {
      let bundle

      switch (readVersionType(version)) {
        case 'release':
          bundle = version._system.release?._ref
          break
        case 'published':
          bundle = 'published'
          break
        case 'draft':
          bundle = 'drafts'
          break
      }

      if (typeof bundle === 'undefined') {
        return currentVariantsByRelease
      }

      if (!currentVariantsByRelease.has(bundle)) {
        currentVariantsByRelease.set(bundle, [])
      }

      const currentVersions = currentVariantsByRelease.get(bundle)
      currentVersions?.push(version)

      return currentVariantsByRelease
    }, new Map())

  const sets = [...variantsByRelease.entries()].map<VariantSet>(([releaseId, releaseVariants]) => {
    return {
      key: releaseId,
      name: getReleaseName({releaseId, releases, t}),
      variants: releaseVariants.map<Variant>((variant) => ({
        id: variant._id,
        name: getVariantName({document: variant, variants, t}),
        releaseDocument: releases.get(releaseId),
        document: variant,
      })),
    }
  })

  if (typeof proposedChangesId !== 'undefined') {
    return sets.toSpliced(0, 0, {
      key: 'studio:content-agent',
      name: t('content-agent'),
      variants: [
        {
          id: proposedChangesId,
          name: t('version.agent-bundle.proposed-changes'),
        },
      ],
    })
  }

  return sets
}

interface GetNameOptions {
  releases: Map<string, ReleaseDocument>
  t: TFunction
}

function getVariantName({
  document,
  variants,
  t,
}: Pick<GetNameOptions, 't'> & {
  document: VersionInfoDocumentStub
  variants: Map<string, SystemVariant>
}): string {
  const releaseDocumentId = document._system.variant?._ref
  const release = releaseDocumentId ? variants.get(releaseDocumentId) : undefined
  return release?.metadata?.title ?? t('document-group.base-variant')
}

function getVersionName({
  document,
  releases,
  t,
}: GetNameOptions & {document: VersionInfoDocumentStub}): string {
  const state = readVersionType(document)

  if (state === 'draft') {
    return t('release.chip.draft')
  }

  if (state === 'published') {
    return t('release.chip.published')
  }

  const release = releases.get(document._system.release?._ref ?? '')
  return release?.metadata.title ?? document._system.release?._ref ?? document._id
}

function getReleaseName({releaseId, releases, t}: GetNameOptions & {releaseId: string}): string {
  if (releaseId === ('published' satisfies SystemBundle)) {
    return t(`release.chip.published`)
  }

  if (releaseId === ('drafts' satisfies SystemBundle)) {
    return t(`release.chip.draft`)
  }

  const release = releases.get(releaseId)
  return release?.metadata.title ?? releaseId
}
