import {type ReleaseDocument} from '@sanity/client'
import {
  type PerspectiveContextValue,
  type SystemVariant,
  type VersionInfoDocumentStub,
} from 'sanity'

/** The document every fixture version belongs to. */
export const GROUP_ID = 'article-1'

type Bundle = 'published' | 'drafts' | {release: string} | {agent: string}

/**
 * A version stub of `article-1` the way `useDocumentVersions` resolves it. Variant versions get an
 * opaque scope in their id, so nothing reads the bundle or the variant from the id.
 */
export function createVersion(options: {
  bundle: Bundle
  variant?: string
}): VersionInfoDocumentStub {
  const {bundle, variant} = options
  const scope = variant ? `scope-${variant}-${bundleKey(bundle)}` : bundleKey(bundle)

  return {
    _id: getVersionDocumentId(bundle, scope, Boolean(variant)),
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'article',
    _system: {
      group: {_ref: GROUP_ID, _weak: true},
      ...(bundle === 'drafts' ? {bundleId: 'drafts'} : {}),
      ...(typeof bundle === 'object' && 'release' in bundle
        ? {bundleId: bundle.release, release: {_ref: `_.releases.${bundle.release}`, _weak: true}}
        : {}),
      ...(typeof bundle === 'object' && 'agent' in bundle ? {bundleId: bundle.agent} : {}),
      ...(variant
        ? {variants: [{_ref: `_.variants.${variant}`, _key: variant}], scopeId: scope}
        : {}),
    },
  }
}

function bundleKey(bundle: Bundle): string {
  if (typeof bundle === 'string') return bundle
  return 'release' in bundle ? bundle.release : bundle.agent
}

function getVersionDocumentId(bundle: Bundle, scope: string, isVariant: boolean): string {
  if (isVariant) return `versions.${scope}.${GROUP_ID}`
  if (bundle === 'published') return GROUP_ID
  if (bundle === 'drafts') return `drafts.${GROUP_ID}`
  return `versions.${scope}.${GROUP_ID}`
}

/** A variant definition. `type` is its `metadata.type`; omitted, it is the default type. */
export function createVariant(name: string, title: string, type?: string): SystemVariant {
  return {
    _id: `_.variants.${name}`,
    _type: 'system.variant',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _rev: `rev-${name}`,
    conditions: {audience: name},
    priority: 0,
    metadata: {title, ...(type ? {type} : {})},
  }
}

/** An active release, as `useActiveReleases` returns it. */
export function createRelease(releaseId: string, title: string): ReleaseDocument {
  return {
    _id: `_.releases.${releaseId}`,
    _type: 'system.release',
    _rev: `rev-${releaseId}`,
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    name: releaseId,
    state: 'active',
    metadata: {title, releaseType: 'asap'},
  }
}

/** The perspective context with the drafts perspective and no variant, plus `overrides`. */
export function createPerspective(
  overrides: Partial<PerspectiveContextValue> = {},
): PerspectiveContextValue {
  const selectedVariants = overrides.selectedVariants ?? []
  return {
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    selectedPerspective: 'drafts',
    perspectiveStack: ['drafts'],
    excludedPerspectives: [],
    selectedVariantNames: [],
    // oxlint-disable-next-line typescript/no-deprecated -- the context still carries the single-variant fields
    selectedVariantName: undefined,
    // oxlint-disable-next-line typescript/no-deprecated -- the context still carries the single-variant fields
    selectedVariant: selectedVariants[0],
    bundle: 'drafts',
    ...overrides,
    selectedVariants,
  }
}
