import {
  getReleaseIdFromReleaseDocumentId,
  getVariantTitle,
  type ReleaseDocument,
  type SystemVariant,
  type VersionInfoDocumentStub,
} from 'sanity'

const VARIANT_ID_PREFIX = '_.variants.'

/** `'published'` and `'drafts'` are pseudo-bundles; everything else is a release id. */
export const PUBLISHED_BUNDLE = 'published'
export const DRAFTS_BUNDLE = 'drafts'

export interface GridColumn {
  /** The short variant id, or `undefined` for the default (base document) column. */
  variantId: string | undefined
  title: string
  /** The variant is referenced by version documents but its definition no longer exists. */
  missingDefinition: boolean
}

export interface GridRow {
  /** `'published'`, `'drafts'`, or a release id. */
  bundleId: string
  title: string
  kind: 'published' | 'drafts' | 'release' | 'unknown'
  release?: ReleaseDocument
  /** 1-based position in the current perspective stack (1 = wins), when part of it. */
  stackIndex?: number
}

/** The full variant definition document id from a version stub, when variant-scoped. */
export function getVariantDocumentId(ref: string | undefined): SystemVariant['_id'] | undefined {
  if (typeof ref !== 'string' || !ref.startsWith(VARIANT_ID_PREFIX)) {
    return undefined
  }
  return ref as SystemVariant['_id']
}

/** Builds the full variant definition document id from a short variant id. */
export function toVariantDocumentId(
  shortVariantId: string | undefined,
): SystemVariant['_id'] | undefined {
  if (!shortVariantId) {
    return undefined
  }
  return `${VARIANT_ID_PREFIX}${shortVariantId}` as SystemVariant['_id']
}

/** Strips the `_.variants.` document path prefix, mirroring `getVariantId` in `sanity`. */
export function toShortVariantId(variantRef: string): string {
  return variantRef.startsWith(VARIANT_ID_PREFIX)
    ? variantRef.slice(VARIANT_ID_PREFIX.length)
    : variantRef
}

/** The short variant id a version document belongs to, or `undefined` for base documents. */
export function getStubVariantId(stub: VersionInfoDocumentStub): string | undefined {
  const variantRef = stub._system?.variant?._ref
  return variantRef ? toShortVariantId(variantRef) : undefined
}

/**
 * The bundle a version document belongs to. Published documents (base and variant-of-published)
 * carry no `_system.bundleId`.
 */
export function getStubBundleId(stub: VersionInfoDocumentStub): string {
  return stub._system?.bundleId ?? PUBLISHED_BUNDLE
}

/**
 * Grid columns: the default (base) column first, then one column per variant — in the same order
 * as the variant picker (`useAllVariants`). Variants without any version document are omitted,
 * except the currently selected one (so the base-content fallback is visible as an empty column).
 * Variant ids referenced by version documents whose definition was deleted are appended last.
 */
export function buildColumns(options: {
  versions: VersionInfoDocumentStub[]
  variants: SystemVariant[]
  selectedVariantId: string | undefined
}): GridColumn[] {
  const {versions, variants, selectedVariantId} = options

  const variantIdsWithDocuments = new Set(
    versions.map(getStubVariantId).filter((id): id is string => id !== undefined),
  )

  const columns: GridColumn[] = [{variantId: undefined, title: 'Default', missingDefinition: false}]

  for (const variant of variants) {
    const shortId = toShortVariantId(variant._id)
    if (variantIdsWithDocuments.has(shortId) || shortId === selectedVariantId) {
      columns.push({variantId: shortId, title: getVariantTitle(variant), missingDefinition: false})
    }
    variantIdsWithDocuments.delete(shortId)
  }

  // Variant documents referencing definitions that no longer exist (or are still loading).
  for (const shortId of [...variantIdsWithDocuments].sort()) {
    columns.push({variantId: shortId, title: shortId, missingDefinition: true})
  }

  return columns
}

/**
 * Grid rows: published on top, drafts second, then releases stacked exactly like the releases
 * perspective picker (`useActiveReleases` order: ASAP, then scheduled, then undecided). Releases
 * without any version document in the group are omitted, except the currently selected one.
 * Bundle ids referenced by version documents that match no active release are appended last.
 */
export function buildRows(options: {
  versions: VersionInfoDocumentStub[]
  /** In `useActiveReleases` order — the same order the perspective picker renders. */
  releases: ReleaseDocument[]
  selectedPerspective: string
  perspectiveStack: string[]
}): GridRow[] {
  const {versions, releases, selectedPerspective, perspectiveStack} = options

  const bundleIdsWithDocuments = new Set(versions.map(getStubBundleId))
  bundleIdsWithDocuments.delete(PUBLISHED_BUNDLE)
  bundleIdsWithDocuments.delete(DRAFTS_BUNDLE)

  const withStackIndex = (row: Omit<GridRow, 'stackIndex'>): GridRow => {
    const index = perspectiveStack.indexOf(row.bundleId)
    return index === -1 ? row : {...row, stackIndex: index + 1}
  }

  const rows: GridRow[] = [
    withStackIndex({bundleId: PUBLISHED_BUNDLE, title: 'Published', kind: 'published'}),
    withStackIndex({bundleId: DRAFTS_BUNDLE, title: 'Drafts', kind: 'drafts'}),
  ]

  for (const release of releases) {
    const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
    if (bundleIdsWithDocuments.has(releaseId) || releaseId === selectedPerspective) {
      rows.push(
        withStackIndex({
          bundleId: releaseId,
          title: release.metadata.title || releaseId,
          kind: 'release',
          release,
        }),
      )
    }
    bundleIdsWithDocuments.delete(releaseId)
  }

  // Bundles referencing releases that are no longer active (archived, published…).
  for (const bundleId of [...bundleIdsWithDocuments].sort()) {
    rows.push(withStackIndex({bundleId, title: bundleId, kind: 'unknown'}))
  }

  return rows
}

function getCellKey(bundleId: string, variantId: string | undefined): string {
  return `${bundleId}\u0000${variantId ?? ''}`
}

/** Indexes the group's version documents by (bundle, variant) cell. */
export function buildCellIndex(
  versions: VersionInfoDocumentStub[],
): Map<string, VersionInfoDocumentStub[]> {
  const index = new Map<string, VersionInfoDocumentStub[]>()
  for (const stub of versions) {
    const key = getCellKey(getStubBundleId(stub), getStubVariantId(stub))
    const cell = index.get(key)
    if (cell) {
      cell.push(stub)
    } else {
      index.set(key, [stub])
    }
  }
  return index
}

export function getCellDocuments(
  index: Map<string, VersionInfoDocumentStub[]>,
  bundleId: string,
  variantId: string | undefined,
): VersionInfoDocumentStub[] {
  return index.get(getCellKey(bundleId, variantId)) ?? []
}
