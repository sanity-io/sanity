import {type SanityDocument} from '@sanity/types'

import {extractSearchableText} from './extractSearchableText'

/**
 * This is a temporary way of doing the search without the previews
 * until we have it moved to the server side
 *
 * @param document - The document to search
 * @param searchTerm - The search term
 * @returns True if the document matches the search term, false otherwise
 */
export function searchDocumentRelease(
  document: SanityDocument & {
    publishedDocumentExists: boolean
  },
  searchTerm: string,
) {
  // if there is no search term or the document has no title or name, return false
  if (!searchTerm || searchTerm.trim().length === 0 || (!document.title && !document.name)) {
    return false
  }

  const title = extractSearchableText(document.title)
  const name = extractSearchableText(document.name)

  const normalizedSearchTerm = searchTerm.toLowerCase().trim()
  const normalizedTitle = title.toLowerCase()
  const normalizedName = name.toLowerCase()

  const hasTitle = normalizedTitle.trim().length > 0
  const hasName = normalizedName.trim().length > 0

  // Create a combined searchable text from both title and name
  const combinedText = `${normalizedTitle} ${normalizedName}`

  // Split search term into words for more flexible matching
  const searchWords = normalizedSearchTerm.split(/\s+/).filter((word) => word.length > 0)

  // Check if all search words are found in either title, name, or combined text
  const allWordsMatch = searchWords.every(
    (word) =>
      (hasTitle && normalizedTitle.includes(word)) ||
      (hasName && normalizedName.includes(word)) ||
      combinedText.includes(word),
  )

  // Also check if the document name/title is contained within the search term
  const documentInSearchTerm =
    (hasName && normalizedSearchTerm.includes(normalizedName)) ||
    (hasTitle && normalizedSearchTerm.includes(normalizedTitle))

  return allWordsMatch || documentInSearchTerm
}
