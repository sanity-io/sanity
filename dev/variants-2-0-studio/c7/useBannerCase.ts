import {useEffect} from 'react'
import {isReleaseDocument, usePerspective, useWorkspace} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {isReleaseScheduledOrScheduling} from '../../../packages/sanity/src/core/releases/util/util'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion} from '../data/versions'

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
/** The titles of the variant definitions seen this session, so a variant deleted later is still named by its title (never by its id). */
const seenTitles = new Map<string, string>()

/** Does the document already have a version for this variant in the version the studio shows? (Ported from the Design Studio's C7.) */
function hasVariantHere(versions: readonly AudienceVersion[], variantId: string, version: string) {
  return versions.some((v) => {
    if (v.variantId !== variantId) return false
    if (version === 'drafts') return v.state === 'draft' || v.state === 'published'
    if (version === 'published') return v.state === 'published'
    return v.bundleId === version
  })
}

/**
 * Which T6 banner a document shows, or none: the one decision, read by the banner (c7/OpenBetaBanner.tsx) and by the inventory, whose
 * toolbar Create version steps aside while the banner offers its own (22 Oct call: one Create version on screen).
 * - `deleted`: the chosen variant no longer exists;
 * - `drafts`, `release`: no version of the chosen variant here, and one can be created (the banner's Create version);
 * - `published`: no version here. With no draft either (`createsDraft`), the banner's Create version makes one in Drafts and takes the
 *   viewer there in one step (26 Oct call: the old Switch to Drafts, then Create version, was two steps). With a draft, the banner's button
 *   is Switch to Drafts; without Drafts (live edit), it has no button;
 * - `scheduled`: no version here, and none can be created here;
 * - `base-release`: no variant chosen, an open release in view, and the base document is not in it. Core's own banner draws this one
 *   ("Not in the … release." with Add to release); it is here so the inventory's toolbar Create version steps aside for it too.
 */
export type BannerCase =
  | {kind: 'deleted'; goneTitle: string | undefined}
  | {
      kind: 'drafts' | 'published' | 'scheduled' | 'release'
      audience: string
      releaseTitle: string
      /** The variant's short id: the Published banner's one-step Create version needs it. */
      variantId: string
      /** `published` only: the variant has no draft either, and Drafts exist, so Create version makes it in Drafts. */
      createsDraft?: boolean
    }
  | {kind: 'base-release'}
  | null

/**
 * The banner case and whether it is known yet. It is pending while what it is decided from is still loading: the document's versions,
 * the variant definitions (with a variant chosen), or the release in view. While pending, the inventory's toolbar shows neither its Create
 * version nor its count, so the wrong one is never on screen (Faheem, 22 Oct).
 */
export function useBannerDecision(documentId: string): {pending: boolean; banner: BannerCase} {
  const {selectedPerspective, selectedPerspectiveName, selectedVariantName} = usePerspective()
  const {chosen} = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(documentId)
  const banner = useBannerCase(documentId)
  const releaseInView =
    selectedPerspectiveName !== undefined &&
    selectedPerspectiveName !== 'drafts' &&
    selectedPerspectiveName !== 'published'
  const pending =
    !versions ||
    (Boolean(selectedVariantName || Object.keys(chosen).length) && !definitions.length) ||
    (releaseInView && !isReleaseDocument(selectedPerspective))
  return {pending, banner: pending ? null : banner}
}

export function useBannerCase(documentId: string): BannerCase {
  const {selectedPerspective, selectedPerspectiveName, selectedVariantName} = usePerspective()
  const {chosen} = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(documentId)
  const pane = useDocumentPane()
  // Drafts exist unless the document type is live edit or the workspace has the draft model off (the pills' rule for the Draft pill).
  const hasDrafts = useWorkspace().document.drafts.enabled && !pane.schemaType?.liveEdit

  useEffect(() => {
    for (const d of definitions)
      if (d.metadata?.title) seenTitles.set(shortId(d._id), d.metadata.title)
  }, [definitions])

  // The chosen variant no longer exists: the router names one that no definition carries (once the definitions have loaded).
  if (
    selectedVariantName &&
    definitions.length &&
    !definitions.some((d) => shortId(d._id) === shortId(selectedVariantName))
  ) {
    return {kind: 'deleted', goneTitle: seenTitles.get(shortId(selectedVariantName))}
  }

  const entries = Object.entries(chosen)
  if (!versions) return null
  if (!entries.length) {
    // No variant: only an open release the base document is not in has a banner with a button (core's Add to release).
    const open =
      isReleaseDocument(selectedPerspective) && !isReleaseScheduledOrScheduling(selectedPerspective)
    const inIt = versions.some((v) => v.audience === null && v.bundleId === selectedPerspectiveName)
    return open && versions.some((v) => v.audience === null) && !inIt
      ? {kind: 'base-release'}
      : null
  }
  const definition = definitions.find((d) => {
    const own = Object.entries(d.conditions)
    return own.length === entries.length && own.every(([name, key]) => chosen[name] === key)
  })
  if (!definition) return null
  const variantId = shortId(definition._id)
  const audience = definition.metadata?.title ?? variantId
  const version = selectedPerspectiveName ?? 'drafts'
  if (hasVariantHere(versions, variantId, version)) return null

  const release = isReleaseDocument(selectedPerspective) ? selectedPerspective : undefined
  const releaseTitle = release?.metadata?.title || version
  if (version === 'drafts') return {kind: 'drafts', audience, releaseTitle, variantId}
  if (version === 'published') {
    const hasDraft = versions.some((v) => v.variantId === variantId && v.state === 'draft')
    return {
      kind: 'published',
      audience,
      releaseTitle,
      variantId,
      createsDraft: hasDrafts && !hasDraft,
    }
  }
  if (release && isReleaseScheduledOrScheduling(release))
    return {kind: 'scheduled', audience, releaseTitle, variantId}
  return {kind: 'release', audience, releaseTitle, variantId}
}

/**
 * A banner shows a create button: Create version (Drafts, an open release, or Published with no draft to switch to) or core's Add to
 * release (the base document).
 */
export const bannerOffersCreate = (c: BannerCase) =>
  c?.kind === 'drafts' ||
  c?.kind === 'release' ||
  c?.kind === 'base-release' ||
  (c?.kind === 'published' && Boolean(c.createsDraft))
