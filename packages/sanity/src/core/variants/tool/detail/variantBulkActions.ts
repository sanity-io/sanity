import {type ReleaseDocument} from '@sanity/client'
import {getPublishedId} from '@sanity/client/csm'

import {type VariantDocumentBundleId} from '../../store/variantsClient'
import {type ReleaseLaneKind, resolveVersionBundle, type ResolvedVersionBundle} from './releaseLane'
import {type DocumentInVariantGroup} from './types'
import {getDocumentPreviewTitle} from './variantDocumentTable/getDocumentPreviewTitle'

/**
 * The bulk actions the variant detail documents table offers. Each maps to a native variant
 * document action (`publish` / `unpublish` / `delete`) and, crucially, to the set of bundle kinds
 * it may legitimately touch — the axis that makes a per-document bulk selection unambiguous.
 *
 * @internal
 */
export type VariantBulkAction = 'publish' | 'unpublish' | 'delete'

/**
 * Which resolved bundle kinds each action legitimately targets (per `variants/ACTIONS.md`):
 *
 * - **publish** — only a `drafts`-scoped version (release-scoped variants publish with their
 *   release, so they are never publish targets).
 * - **unpublish** — the `published` variant (hard unpublish now) and `release`-scoped versions
 *   (soft unpublish, completed when the release runs); never `drafts` (nothing published to remove).
 * - **delete** — `drafts` and `release` versions (the Studio's "discard changes" for variant
 *   versions); deleting the variant-of-published is not allowed (removing it is unpublish's job).
 *
 * @internal
 */
export const VARIANT_BULK_ACTION_KINDS: Record<VariantBulkAction, ReleaseLaneKind[]> = {
  publish: ['drafts'],
  unpublish: ['published', 'release'],
  delete: ['drafts', 'release'],
}

/**
 * One concrete (document × bundle) target a bulk action will act on. A selected document group can
 * fan out to several targets — e.g. discarding a document that lives in a draft and two releases —
 * so the confirmation dialog enumerates targets, not selected rows.
 *
 * @internal
 */
export interface VariantBulkActionTarget {
  /** Stable key: `groupId:bundleId`. */
  key: string
  groupId: string
  /** The document's preview title, for the confirmation list. */
  title: string
  /** The base (group) published id — the `publishedId` the variant action expects. */
  publishedId: string
  /** The short variant name — the `variantId` the variant action expects. */
  variantId: string
  /** Lifted verbatim from `version.bundleId`; `undefined` for the variant-of-published. */
  bundleId: VariantDocumentBundleId
  /** The resolved bundle descriptor, for grouping + labelling in the dialog. */
  bundle: ResolvedVersionBundle
}

/**
 * Expands the selected document groups into the concrete per-bundle targets a given bulk action
 * will touch, deduped so a group counts at most once per bundle. This is both what the confirmation
 * dialog renders (grouped by bundle) and what the operation fan-out dispatches — one enumeration,
 * so the honest "what will change" preview and the actual writes cannot diverge.
 *
 * @internal
 */
export function getVariantBulkActionTargets(
  groups: DocumentInVariantGroup[],
  variantId: string,
  action: VariantBulkAction,
  releasesById: Map<string, ReleaseDocument>,
): VariantBulkActionTarget[] {
  const kinds = VARIANT_BULK_ACTION_KINDS[action]
  const targets: VariantBulkActionTarget[] = []

  for (const group of groups) {
    const publishedId = getPublishedId(group.document._id)
    const title = getDocumentPreviewTitle(group.document)
    const seenBundles = new Set<string>()

    for (const version of group.versions) {
      const bundle = resolveVersionBundle(version, releasesById)
      if (!kinds.includes(bundle.kind)) continue
      // A group can carry more than one version resolving to the same bundle; act on it once.
      if (seenBundles.has(bundle.id)) continue
      seenBundles.add(bundle.id)

      targets.push({
        key: `${group.groupId}:${bundle.id}`,
        groupId: group.groupId,
        title,
        publishedId,
        variantId,
        bundleId: version.bundleId,
        bundle,
      })
    }
  }

  return targets
}
