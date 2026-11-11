import {type ReleaseDocument} from '@sanity/client'

import {type TFunction} from '../../i18n/types'
import {buildInventoryIndex, toVersionStub} from '../../inventoryModel/buildInventoryIndex'
import {documentLens} from '../../inventoryModel/lenses'
import {type ReleaseOrderOptions, type VersionStub} from '../../inventoryModel/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getVersionFromId, type SystemBundle} from '../../util/draftUtils'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {readVersionType} from '../../util/versionsUtils'
import {type SystemVariant} from '../../variants/types'
import {
  type Meta,
  type VariantSet,
  type VariantSetBundle,
} from '../machines/documentGroupInventoryMachine'
import {type Variant} from '../machines/selectionMachine'

/**
 * Where the two sets whose position is still an open product question go.
 *
 * @internal
 */
export interface InventorySetPlacement {
  /** `first` puts Proposed changes above Drafts; `afterDrafts` puts it between Drafts and the releases. */
  proposedChanges: 'first' | 'afterDrafts'
  /**
   * `byDate` sorts scheduled drafts among the scheduled releases by publish date; `afterReleases`
   * puts them after every other release.
   */
  scheduledDrafts: NonNullable<ReleaseOrderOptions['scheduledDrafts']>
}

/**
 * Placement pending the Q3 decision on Proposed changes and scheduled drafts. Change it here
 * once that decision lands rather than at the call sites.
 *
 * @internal
 */
const DEFAULT_INVENTORY_SET_PLACEMENT: InventorySetPlacement = {
  proposedChanges: 'first',
  scheduledDrafts: 'byDate',
}

/**
 * @internal
 */
export function computeSets({
  meta,
  current,
  t,
  variantsEnabled,
  placement = DEFAULT_INVENTORY_SET_PLACEMENT,
}: {
  meta: Meta | undefined
  current: VariantSet[]
  t: TFunction
  variantsEnabled: boolean | undefined
  placement?: InventorySetPlacement
}): VariantSet[] {
  if (!meta) {
    return current
  }

  const {releases} = meta.releases
  const {variants} = meta.variants
  const userBundleIds = new Set(meta.agentBundles.bundles.map(({id}) => id))

  const documents = new Map(meta.versionState.versions.map((version) => [version._id, version]))
  const index = buildInventoryIndex({
    versions: meta.versionState.versions
      .map(toVersionStub)
      .filter((stub): stub is VersionStub => Boolean(stub)),
    releases,
    scheduledDrafts: placement.scheduledDrafts,
  })
  // Every version but agent bundles, in the shared version order: Published, Drafts, then
  // releases in the order they go out.
  const ordered = documentLens(index).flatMap((stub) => {
    const document = documents.get(stub._id)
    return document ? [{stub, document}] : []
  })

  const proposedChanges = meta.versionState.versions.find((version) => {
    const bundleId = getVersionFromId(version._id)
    return typeof bundleId === 'string' && userBundleIds.has(bundleId)
  })

  if (!variantsEnabled) {
    const hasVariants = meta.versionState.versions.some((version) =>
      Boolean(getDocumentVersionVariantId(version)),
    )

    if (hasVariants) {
      console.warn(`Content Variants is switched off, but there are variants of this document.
Switch Content Variants on in your Studio configuration to ensure variants are displayed correctly (set \`beta.variants.enabled\` to \`true\`).`)
    }

    // A version the model cannot classify still shows, after everything it can.
    const classified = new Set(index.versions.map(({_id}) => _id))
    const unclassified = meta.versionState.versions.filter(({_id}) => !classified.has(_id))

    const variants: Variant[] = [
      ...ordered.map(({document}) => document),
      ...unclassified,
    ].map<Variant>((version) => ({
      id: version._id,
      name: getVersionName({document: version, releases, t}),
      document: version,
    }))

    if (proposedChanges) {
      variants.splice(
        getProposedChangesIndex(
          placement,
          ordered.findLastIndex(({stub}) => stub.kind === 'draft'),
        ),
        0,
        {
          id: proposedChanges._id,
          name: t('version.agent-bundle.proposed-changes'),
          document: proposedChanges,
        },
      )
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

  // One set per bundle, in the order the bundles first appear in the shared version order.
  const variantsByBundle = new Map<string, VersionInfoDocumentStub[]>()
  for (const {stub, document} of ordered) {
    const bundleVersions = variantsByBundle.get(stub.bundle)
    if (bundleVersions) {
      bundleVersions.push(document)
    } else {
      variantsByBundle.set(stub.bundle, [document])
    }
  }

  const sets = [...variantsByBundle.entries()].map<VariantSet>(([releaseId, releaseVariants]) => {
    return {
      key: releaseId,
      name: getReleaseName({releaseId, releases, t}),
      bundle: getReleaseBundle({releaseId, releases}),
      variants: releaseVariants.map<Variant>((variant) => ({
        id: variant._id,
        name: getVariantName({document: variant, variants, t}),
        releaseDocument: releases.get(releaseId),
        document: variant,
      })),
    }
  })

  if (proposedChanges) {
    return sets.toSpliced(
      getProposedChangesIndex(
        placement,
        sets.findIndex(({key}) => key === 'drafts'),
      ),
      0,
      {
        key: 'studio:content-agent',
        name: t('content-agent'),
        bundle: {type: 'agent'},
        variants: [
          {
            id: proposedChanges._id,
            name: t('version.agent-bundle.proposed-changes'),
            document: proposedChanges,
          },
        ],
      },
    )
  }

  return sets
}

function getProposedChangesIndex(
  placement: InventorySetPlacement,
  lastDraftsIndex: number,
): number {
  return placement.proposedChanges === 'afterDrafts' ? lastDraftsIndex + 1 : 0
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
  const variantDocumentId = getDocumentVersionVariantId(document)
  const variant = variantDocumentId ? variants.get(variantDocumentId) : undefined
  return variant?.metadata?.title ?? t('document-group.base-variant')
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

function getReleaseBundle({
  releaseId,
  releases,
}: Pick<GetNameOptions, 'releases'> & {releaseId: string}): VariantSetBundle {
  if (
    releaseId === ('published' satisfies SystemBundle) ||
    releaseId === ('drafts' satisfies SystemBundle)
  ) {
    return {
      type: 'perspective',
      perspective: releaseId,
    }
  }

  return {
    type: 'perspective',
    perspective: releases.get(releaseId) ?? '',
  }
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
