import speakingurl from 'speakingurl'

import {type BundleDocument} from '../../store/bundles/types'

/**
 * @internal
 * @hidden
 */
export function getBundleSlug(documentId: string): string {
  if (documentId.indexOf('.') === -1) return 'Published'
  const version = documentId.slice(0, documentId.indexOf('.'))
  return version
}

export function versionDocumentExists(
  documentVersions: BundleDocument[] = [],
  slug: string,
): boolean {
  return documentVersions.some((version) => version.slug === slug)
}

export function isDraftOrPublished(versionName: string): boolean {
  return speakingurl(versionName) === 'drafts' || speakingurl(versionName) === 'published'
}
