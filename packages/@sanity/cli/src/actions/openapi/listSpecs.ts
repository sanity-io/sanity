import {type CliCommandContext} from '../../types'
import {browse} from '../../util/browse'

export interface OpenAPISpec {
  slug: string
  title: string
  description: string
}

export interface ListSpecsOptions {
  web?: boolean
}

export async function listSpecs(
  options: ListSpecsOptions,
  context: CliCommandContext,
): Promise<OpenAPISpec[]> {
  const {output} = context

  // Open in web browser if --web flag is provided
  if (options.web) {
    const url = 'https://www.sanity.io/docs/http-reference'
    output.print(`Opening ${url}`)
    await browse(url)
    return []
  }

  try {
    const url = 'https://www.sanity.io/docs/api/openapi'

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      context.output.error('The OpenAPI service is currently unavailable. Please try again later.')
      process.exit(1)
    }

    const results = await response.json()
    return Array.isArray(results?.specs) ? results.specs : []
  } catch (error) {
    context.output.error('The OpenAPI service is currently unavailable. Please try again later.')
    process.exit(1)
    return [] // satisfy TypeScript, though this line is unreachable
  }
}
