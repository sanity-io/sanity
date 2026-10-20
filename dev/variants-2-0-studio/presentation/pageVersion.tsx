import {Flex, Text} from '@sanity/ui'
import {useContext} from 'react'
import {usePerspective} from 'sanity'
import {PresentationContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {StateDot} from '../c3/StateGlyph'
import {useVariantDefinitions} from '../c1/world'
import {type AudienceVersion} from '../data/versions'
import {useOption} from '../options/store'

export interface PageVersion {
  /** The chosen audience's title, or null when no variant is chosen. */
  audience: string | null
  /** published | draft | release | none */
  kind: 'published' | 'draft' | 'release' | 'none'
  /** "German · draft", "German · published", "Base · no German version". */
  label: string
}

/**
 * The version of a document the chosen audience gets, with the same resolution the studio shows: for the Published
 * perspective the published variant; for Drafts the draft, else the published one; for a release that release's
 * version first. No version of the variant: the base document.
 */
export function pageVersion(versions: readonly AudienceVersion[], variantId: string, title: string, perspective: string): PageVersion {
  const mine = versions.filter((v) => v.variantId === variantId)
  const published = mine.find((v) => v.bundleId === 'published' || v.state === 'published')
  const draft = mine.find((v) => v.bundleId === 'drafts' || v.state === 'draft')
  const release = perspective !== 'drafts' && perspective !== 'published' ? mine.find((v) => v.bundleId === perspective) : undefined
  if (release) return {audience: title, kind: 'release', label: `${title} · ${release.release ?? 'release'}`}
  if (perspective === 'published') {
    return published ? {audience: title, kind: 'published', label: `${title} · published`} : {audience: title, kind: 'none', label: `Base · no ${title} version`}
  }
  if (draft) return {audience: title, kind: 'draft', label: `${title} · draft`}
  if (published) return {audience: title, kind: 'published', label: `${title} · published`}
  return {audience: title, kind: 'none', label: `Base · no ${title} version`}
}

/** With C1 A or B and a variant chosen: the audience's variant id and title; else null. `presentation` = inside Presentation. */
export function usePresentationAudience(only?: 'presentation'): {variantId: string; title: string; perspective: string; presentation: boolean} | null {
  const inPresentation = useContext(PresentationContext) !== null
  const c1 = useOption('c1')
  const router = useRouter()
  const {selectedPerspectiveName} = usePerspective()
  const definitions = useVariantDefinitions()
  const variantId = typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined
  if ((only === 'presentation' && !inPresentation) || (c1 !== 'a' && c1 !== 'b') || !variantId) return null
  const def = definitions.find((d) => d._id.replace(/^_\.variants\./, '') === variantId)
  return {variantId, title: def?.metadata?.title ?? variantId, perspective: selectedPerspectiveName ?? 'drafts', presentation: inPresentation}
}

/** The state label of a row in "Documents on this page". */
export function PageVersionLabel({version}: {version: PageVersion}) {
  return (
    <Flex align="center" data-testid="page-version" gap={2}>
      <StateDot kind={version.kind} />
      <Text muted={version.kind === 'none'} size={0} style={{whiteSpace: 'nowrap'}}>
        {version.label}
      </Text>
    </Flex>
  )
}
