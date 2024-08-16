import speakingurl from 'speakingurl'

import {type BundleDocument} from '../../store/bundles/types'
import {isVersionId} from '../../util'

/**
 * @internal
 * @hidden
 */
export function getBundleSlug(documentId: string): string | undefined {
  if (documentId.indexOf('.') === -1) return undefined

  if (isVersionId(documentId)) {
    const [, bundleSlug] = documentId.split('.')
    return bundleSlug
  }

  return undefined
}

/**
 * @beta
 * @param documentId - The document id, e.g. `my-document-id` or `drafts.my-document-id` or `summer.my-document-id`
 * @param perspective - The current perspective, e.g. `bundle.summer` or undefined, it can be obtained from `useRouter().stickyParams.perspective`
 * @returns boolean - `true` if the document is in the current perspective.
 * e.g:
 * - document: `summer.my-document-id`, perspective: `bundle.summer` : **true**
 * - document: `my-document-id`, perspective: `bundle.summer` : **false**
 * - document: `summer.my-document-id`perspective: `bundle.winter` : **false**
 * - document: `summer.my-document-id`, perspective: `undefined` : **false**
 * - document: `my-document-id`, perspective: `undefined` : **true**
 * - document: `drafts.my-document-id`, perspective: `undefined` : **true**
 */
export function getDocumentIsInPerspective(
  documentId: string,
  perspective: string | undefined,
): boolean {
  const bundleSlug = getBundleSlug(documentId)

  if (!perspective) return !isVersionId(documentId)

  if (!perspective.startsWith('bundle.')) return false
  // perspective is `bundle.${bundleSlug}`

  if (bundleSlug === 'Published') return false
  return bundleSlug === perspective.replace('bundle.', '')
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
