import {type SanityClient, type SanityDocument} from 'sanity'
import speakingurl from 'speakingurl'

import {type BundleDocument} from '../../store/bundles/types'

/* MOSTLY TEMPORARY FUNCTIONS / DUMMY DATA */

/**
 * Returns all versions of a document
 * @internal
 *
 * @param documentId - document id
 * @param client - sanity client
 * @returns array of SanityDocuments versions from a specific doc
 */
export async function getAllVersionsOfDocument(
  bundles: BundleDocument[] | null,
  client: SanityClient,
  documentId: string,
): Promise<BundleDocument[]> {
  // remove all versions, get just id (anything anything after first .)
  const id = documentId.replace(/^[^.]*\./, '')

  const query = `*[_id match "*${id}*"]`

  return await client.fetch(query, {}, {tag: 'document.list-versions'}).then((documents) => {
    return documents.map((doc: SanityDocument) => {
      const sluggedName = getVersionName(doc._id)
      const bundle = bundles?.find((b) => b.name === sluggedName)
      return {
        name: speakingurl(sluggedName),
        title: bundle?.title || sluggedName,
        hue: bundle?.hue || 'gray',
        icon: bundle?.icon || 'cube',
        publishAt: bundle?.publishAt,
      }
    })
  })
}

export function getVersionName(documentId: string): string {
  if (documentId.indexOf('.') === -1) return 'Published'
  const version = documentId.slice(0, documentId.indexOf('.'))
  return version
}

export function versionDocumentExists(documentVersions: BundleDocument[], name: string): boolean {
  return documentVersions.some((version) => version.name === name)
}

export function isDraftOrPublished(versionName: string): boolean {
  return speakingurl(versionName) === 'drafts' || speakingurl(versionName) === 'published'
}
