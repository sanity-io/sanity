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

  const baseUrl = 'https://www.sanity.io/docs/api/search/semantic'
  const url = new URL(baseUrl)
  url.searchParams.set('query', options.query)

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    output.error('The documentation search API is currently unavailable. Please try again later.')
    process.exit(1)
  }

  const results = await response.json()
  return Array.isArray(results) ? results.slice(0, limit) : []
}
