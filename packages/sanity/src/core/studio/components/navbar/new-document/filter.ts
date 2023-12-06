import {NewDocumentOption} from './types'

function isQueryMatch(query: string, option: NewDocumentOption): boolean {
  const lowercaseTitle = option.title.toLowerCase()
  const lowercaseQuery = query.trim().toLowerCase()

  // Split the query into words (separated by spaces, dashes or underscores)
  const words = lowercaseQuery.split(/[\s\-_]+/)

  return words.every((word) => lowercaseTitle.includes(word))
}

// Sort the results based on relevance. The result should be sorted based on the following criteria:
// 1. If the title starts with the query, it should be first
// 2. If the title includes the query, it should be second
function sortResultRelevance(query: string, a: NewDocumentOption, b: NewDocumentOption): number {
  const titleA = a.title.toLowerCase()
  const titleB = b.title.toLowerCase()
  const lowercaseQuery = query.trim().toLowerCase()

  if (titleA.startsWith(lowercaseQuery) && !titleB.startsWith(lowercaseQuery)) {
    return -1
  }

  if (titleB.startsWith(lowercaseQuery) && !titleA.startsWith(lowercaseQuery)) {
    return 1
  }

  if (titleA.includes(lowercaseQuery) && !titleB.includes(lowercaseQuery)) {
    return -1
  }

  if (titleB.includes(lowercaseQuery) && !titleA.includes(lowercaseQuery)) {
    return 1
  }

  return 0
}

export function filterOptions(options: NewDocumentOption[], query: string): NewDocumentOption[] {
  const optionsWithTitle = options.map((option) => ({
    ...option,
    title: option?.title || option.id,
  }))

  // TODO: sort this by the localized titles instead of the fallback titles
  const alphabetized = optionsWithTitle.sort((a, b) => a.title.localeCompare(b.title))

  return alphabetized
    .filter((option) => isQueryMatch(query, option))
    .sort((a, b) => sortResultRelevance(query, a, b))
}
