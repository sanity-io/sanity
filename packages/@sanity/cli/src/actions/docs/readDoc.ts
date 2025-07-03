import {type CliCommandContext} from '../../types'

export interface ReadDocOptions {
  slug: string
}

export async function readDoc(
  options: ReadDocOptions,
  context: CliCommandContext,
): Promise<string | null> {
  const {output} = context

  try {
    // Use production docs URL with .md extension
    const url = `https://www.sanity.io${options.slug}.md`

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000), // 15 second timeout for content
    })

    if (response.status === 404) {
      output.error(`Documentation article not found: ${options.slug}`)
      return null
    }

    if (!response.ok) {
      throw new Error(`Docs API returned ${response.status}: ${response.statusText}`)
    }

    const markdownContent = await response.text()
    return markdownContent
  } catch (error) {
    // Graceful error handling
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        output.warn('Request timed out. Please check your connection and try again.')
      } else if (error.message.includes('fetch')) {
        output.warn('Unable to reach documentation. Please check your internet connection.')
      } else {
        output.warn(`Failed to read documentation: ${error.message}`)
      }
    } else {
      output.warn('An unexpected error occurred while reading documentation.')
    }

    return null
  }
}
