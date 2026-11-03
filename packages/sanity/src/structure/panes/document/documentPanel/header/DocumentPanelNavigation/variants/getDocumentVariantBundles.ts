import {getDocumentVersionVariantId, LATEST, PUBLISHED, type VersionInfoDocumentStub} from 'sanity'

/** @internal */
export interface DocumentVariantBundles {
  /** Bundles of the versions outside any variant. */
  defaultBundles: string[]
  /** Bundles per variant id (`_.variants.<name>`). */
  variantBundles: Map<string, string[]>
}

function getBundleOrder(bundle: string): number {
  if (bundle === PUBLISHED) return 0
  if (bundle === LATEST) return 1
  return 2
}

/**
 * The bundles a document has versions in, per variant: `published`, `drafts`, or the id of the
 * release or other bundle. Every version is one bundle, so a variant with a draft and a release
 * version has two. Published and drafts come first, the rest keep the order of the versions.
 *
 * @internal
 */
export function getDocumentVariantBundles(
  versions: VersionInfoDocumentStub[],
): DocumentVariantBundles {
  const defaultBundles: string[] = []
  const variantBundles = new Map<string, string[]>()

  for (const version of versions) {
    // Published versions are the only ones without a bundle id.
    const bundle = version._system.bundleId ?? PUBLISHED
    const variantId = getDocumentVersionVariantId(version)
    if (!variantId) {
      defaultBundles.push(bundle)
      continue
    }
    const bundles = variantBundles.get(variantId)
    if (bundles) {
      bundles.push(bundle)
    } else {
      variantBundles.set(variantId, [bundle])
    }
  }

  const byBundleOrder = (a: string, b: string) => getBundleOrder(a) - getBundleOrder(b)
  defaultBundles.sort(byBundleOrder)
  for (const bundles of variantBundles.values()) bundles.sort(byBundleOrder)

  return {defaultBundles, variantBundles}
}
