import {type CliCommandContext} from '../../types'

export interface SearchResult {
  path: string
  title: string
  description: string
}

export interface SearchDocsOptions {
  query: string
  limit?: number
}

export async function searchDocs(
  options: SearchDocsOptions,
  context: CliCommandContext,
): Promise<SearchResult[]> {
  const {output} = context
  const {limit = 10} = options

  try {
    const baseUrl = 'https://www.sanity.io/docs/api/search/semantic'
    const url = new URL(baseUrl)
    url.searchParams.set('query', options.query)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}: ${response.statusText}`)
    }

    const results = await response.json()
    return Array.isArray(results) ? results.slice(0, limit) : []
  } catch (error) {
    // Graceful error handling
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        output.warn('Search request timed out. Please check your connection and try again.')
      } else if (error.message.includes('fetch')) {
        output.warn('Unable to reach documentation search. Please check your internet connection.')
      } else {
        output.warn(`Search failed: ${error.message}`)
      }
    } else {
      output.warn('An unexpected error occurred while searching.')
    }

    // Return empty results on error
    return []
  }
}
