import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {type SanityClient, type SanityDocument} from 'sanity'

/* MOSTLY TEMPORARY FUNCTIONS / DUMMY DATA */

const RANDOM_TONES: ColorHueKey[] = [
  'green',
  'yellow',
  'red',
  'purple',
  'blue',
  'cyan',
  'magenta',
  'orange',
]
const RANDOM_SYMBOLS = [
  'archive',
  'edit',
  'eye-open',
  'heart',
  'info-filled',
  'circle',
  'search',
  'sun',
  'star',
  'trash',
  'user',
]

export interface SanityReleaseIcon {
  hue: ColorHueKey
  icon: IconSymbol
}

// move out of here and make it right
export interface Version {
  name: string
  title: string
  icon: IconSymbol
  hue: ColorHueKey
  publishAt: Date | number
}

// dummy data
export const BUNDLES: Version[] = [
  {name: 'draft', title: 'Published + Drafts', icon: 'archive', hue: 'green', publishAt: 0},
  {name: 'previewDrafts', title: 'Preview drafts', icon: 'edit', hue: 'yellow', publishAt: 0},
  {name: 'published', title: 'Published', icon: 'eye-open', hue: 'blue', publishAt: 0},
  {name: 'summerDrop', title: 'Summer Drop', icon: 'sun', hue: 'orange', publishAt: 0},
  {name: 'autumnDrop', title: 'Autumn Drop', icon: 'star', hue: 'red', publishAt: 0},
]

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
  // remove all versions, get just id (anything before .)
  const id = documentId.replace(/^[^.]*\./, '')

  const query = `*[_id match "*${id}*"]`

  return await client.fetch(query).then((documents) => {
    return documents.map((doc: SanityDocument, index: number) => ({
      name: getVersionName(doc._id),
      title: getVersionName(doc._id),
      hue: RANDOM_TONES[index % RANDOM_SYMBOLS.length],
      icon: RANDOM_SYMBOLS[index % RANDOM_SYMBOLS.length],
    }))
  })
}

export function getVersionName(documentId: string): string {
  const version = documentId.slice(0, documentId.indexOf('.'))
  return version
}
