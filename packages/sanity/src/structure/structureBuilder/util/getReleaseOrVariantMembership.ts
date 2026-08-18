import {isSystemBundle, type PerspectiveStack} from 'sanity'

/**
 * Build a document-list filter that matches documents belonging to the selected
 * release and/or variant, using `sanity::partOfRelease` / `sanity::partOfVariant`.
 *
 * @internal
 */
export function getReleaseOrVariantMembership(options: {
  perspectiveStack: PerspectiveStack
  selectedVariantName?: string
}): {
  filter: string
  params: {releaseId?: string; variantId?: string}
  title: string
} {
  const releaseId = !isSystemBundle(options.perspectiveStack[0])
    ? options.perspectiveStack[0]
    : undefined
  const variantId = options.selectedVariantName

  const filterParts = [
    releaseId ? 'sanity::partOfRelease($releaseId)' : undefined,
    variantId ? 'sanity::partOfVariant($variantId)' : undefined,
  ].filter((part): part is string => Boolean(part))

  return {
    filter: filterParts.join(' && ') || 'false',
    params: {
      ...(releaseId ? {releaseId} : {}),
      ...(variantId ? {variantId} : {}),
    },
    title: getReleaseOrVariantMembershipTitle(releaseId, variantId),
  }
}

function getReleaseOrVariantMembershipTitle(
  releaseId: string | undefined,
  variantId: string | undefined,
): string {
  if (releaseId && variantId) {
    return `Release: ${releaseId} and variant: ${variantId}`
  }
  if (releaseId) {
    return `Release: ${releaseId}`
  }
  if (variantId) {
    return `Variant: ${variantId}`
  }
  return 'Select a release or variant'
}
