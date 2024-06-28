import {camelCase} from 'lodash'
import {type SanityClient, type SanityDocument} from 'sanity'

import {type Version} from '../types'
import {RANDOM_SYMBOLS, RANDOM_TONES} from './const'

/* MOSTLY TEMPORARY FUNCTIONS / DUMMY DATA */

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
    return documents.map((doc: SanityDocument, index: number) => ({
      name: getVersionName(doc._id),
      title: getVersionName(doc._id),
      tone: RANDOM_TONES[index % RANDOM_TONES.length],
      icon: RANDOM_SYMBOLS[index % RANDOM_SYMBOLS.length],
    }))
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

export function toSlug(value: string): string {
  return camelCase(value)
}
