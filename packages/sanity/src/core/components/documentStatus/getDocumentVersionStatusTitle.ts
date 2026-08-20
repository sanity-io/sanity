/**
 * Title line in the document versions status tooltip.
 *
 * When variants are enabled, the default lane is a real variant, so unvarianted versions are
 * labeled "All users (Default) · Published". Without variants, only the perspective
 * (Published / Draft / release) is shown.
 *
 * @internal
 */
export function getDocumentVersionStatusTitle({
  variantsEnabled,
  variantTitle,
  releaseTitle,
}: {
  variantsEnabled: boolean
  variantTitle: string
  releaseTitle: string
}): string {
  if (!variantsEnabled) {
    return releaseTitle
  }

  return `${variantTitle} · ${releaseTitle}`
}
