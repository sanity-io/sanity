import {type SanityClient, type SanityDocument} from 'sanity'
import speakingurl from 'speakingurl'

import {type Version} from '../types'
import {BUNDLES, RANDOM_SYMBOLS, RANDOM_TONES} from './const'

/* MOSTLY TEMPORARY FUNCTIONS / DUMMY DATA */

export const getRandomToneIcon = () => ({
  tone: RANDOM_TONES[Math.floor(Math.random() * RANDOM_TONES.length)],
  icon: RANDOM_SYMBOLS[Math.floor(Math.random() * RANDOM_SYMBOLS.length)],
})

/**
 * Returns all versions of a document
 *
 * @param documentId - document id
 * @param client - sanity client
 * @returns array of SanityDocuments versions from a specific doc
 */
export async function getAllVersionsOfDocument(
  client: SanityClient,
  documentId: string,
): Promise<Version[]> {
  // remove all versions, get just id (anything anything after first .)
  const id = documentId.replace(/^[^.]*\./, '')

  const query = `*[_id match "*${id}*"]`

  return await client.fetch(query, {}, {tag: 'document.list-versions'}).then((documents) => {
    return documents.map((doc: SanityDocument) => {
      const sluggedName = getVersionName(doc._id)
      const bundle = BUNDLES.find((b) => b.name === sluggedName)
      return {
        name: speakingurl(sluggedName),
        title: bundle?.title || sluggedName,
        tone: bundle?.tone || 'default',
        icon: bundle?.icon || 'cube',
      }
    })
  })
}

export function getVersionName(documentId: string): string {
  if (documentId.indexOf('.') === -1) return 'Published'
  const version = documentId.slice(0, documentId.indexOf('.'))
  return version
}

export function versionDocumentExists(documentVersions: Version[], name: string): boolean {
  return documentVersions.some((version) => version.name === name)
}

export function isDraftOrPublished(versionName: string): boolean {
  return speakingurl(versionName) === 'drafts' || speakingurl(versionName) === 'published'
}
