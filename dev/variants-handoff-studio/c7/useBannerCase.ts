import {useEffect} from 'react'
import {getVariantTitle, isReleaseDocument, usePerspective, useWorkspace} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {isReleaseScheduledOrScheduling} from '../../../packages/sanity/src/core/releases/util/util'
import {useAllVariants} from '../../../packages/sanity/src/core/variants/store/useAllVariants'
import {useVersionList} from '../data/useVersionList'

const shortId = (id: string) => id.replace(/^_\.variants\./, '')
/** The titles of the variant definitions seen this session, so a variant deleted later is still named by its title (never by its id). */
const seenTitles = new Map<string, string>()

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
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const {targetDocumentState} = useDocumentPane()
  const versions = useVersionList(documentId)
  const banner = useBannerCase(documentId)
  const releaseInView =
    selectedPerspectiveName !== undefined &&
    selectedPerspectiveName !== 'drafts' &&
    selectedPerspectiveName !== 'published'
  const pending =
    !versions ||
    targetDocumentState.status === 'resolving' ||
    (releaseInView && !isReleaseDocument(selectedPerspective))
  return {pending, banner: pending ? null : banner}
}

/**
 * 10 Nov (Faheem, option B): the case is read from core's own target state for the document (`targetDocumentState`), so it covers every
 * variant main lists (locales too, not only the Handoff's audience dimension), and it follows main's rule for Drafts: a variant that is
 * published but has no draft is simply editable there (typing creates the draft), so it has no banner.
 */
export function useBannerCase(documentId: string): BannerCase {
  const {selectedPerspective, selectedPerspectiveName, selectedVariantNames} = usePerspective()
  const {targetDocumentState, schemaType} = useDocumentPane()
  const {data: allVariants} = useAllVariants()
  const versions = useVersionList(documentId)
  // Drafts exist unless the document type is live edit or the workspace has the draft model off (the pills' rule for the Draft pill).
  const hasDrafts = useWorkspace().document.drafts.enabled && !schemaType?.liveEdit

  useEffect(() => {
    for (const d of allVariants) seenTitles.set(shortId(d._id), getVariantTitle(d))
  }, [allVariants])

  // The chosen variant no longer exists: named by the title seen this session; never by its id.
  if (targetDocumentState.status === 'variant-definition-document-not-found') {
    return {
      kind: 'deleted',
      goneTitle: seenTitles.get(shortId(targetDocumentState.requestedVariantName)),
    }
  }

  if (!selectedVariantNames.length) {
    if (!versions) return null
    // No variant: only an open release the base document is not in has a banner with a button (core's Add to release).
    const open =
      isReleaseDocument(selectedPerspective) && !isReleaseScheduledOrScheduling(selectedPerspective)
    const inIt = versions.some((v) => v.audience === null && v.bundleId === selectedPerspectiveName)
    return open && versions.some((v) => v.audience === null) && !inIt
      ? {kind: 'base-release'}
      : null
  }

  // A version is here, or it is created by typing (main: a published variant in Drafts): no banner.
  if (targetDocumentState.status !== 'variant-missing' || targetDocumentState.creatableTarget)
    return null

  const {variant, siblings} = targetDocumentState
  const variantId = shortId(variant._id)
  const audience = getVariantTitle(variant)
  const version = selectedPerspectiveName ?? 'drafts'
  const release = isReleaseDocument(selectedPerspective) ? selectedPerspective : undefined
  const releaseTitle = release?.metadata?.title || version
  if (version === 'drafts') return {kind: 'drafts', audience, releaseTitle, variantId}
  if (version === 'published') {
    return {
      kind: 'published',
      audience,
      releaseTitle,
      variantId,
      createsDraft: hasDrafts && !siblings.draft,
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
