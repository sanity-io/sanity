import {useEffect} from 'react'
import {isReleaseDocument, usePerspective} from 'sanity'

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
 * - `published`, `scheduled`: no version here, and none can be created here.
 */
export type BannerCase =
  | {kind: 'deleted'; goneTitle: string | undefined}
  | {
      kind: 'drafts' | 'published' | 'scheduled' | 'release'
      audience: string
      releaseTitle: string
    }
  | null

export function useBannerCase(documentId: string): BannerCase {
  const {selectedPerspective, selectedPerspectiveName, selectedVariantName} = usePerspective()
  const {chosen} = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const versions = useVersionList(documentId)

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
  if (!entries.length || !versions) return null
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
  if (version === 'drafts') return {kind: 'drafts', audience, releaseTitle}
  if (version === 'published') return {kind: 'published', audience, releaseTitle}
  if (release && isReleaseScheduledOrScheduling(release))
    return {kind: 'scheduled', audience, releaseTitle}
  return {kind: 'release', audience, releaseTitle}
}

/** The banner shows its Create version (Drafts, or an open release). */
export const bannerOffersCreate = (c: BannerCase) => c?.kind === 'drafts' || c?.kind === 'release'
