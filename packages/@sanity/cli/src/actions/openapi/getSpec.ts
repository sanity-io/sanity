import {type CliCommandContext} from '../../types'
import {browse} from '../../util/browse'

export interface GetSpecOptions {
  slug: string
  format?: 'json' | 'yaml'
  web?: boolean
}

export async function getSpec(
  options: GetSpecOptions,
  context: CliCommandContext,
): Promise<string | null> {
  const {output} = context

  // Open in web browser if --web flag is provided
  if (options.web) {
    const url = `https://www.sanity.io/docs/http-reference/${options.slug}`
    output.print(`Opening ${url}`)
    await browse(url)
    return null
  }

  try {
    const baseUrl = `https://www.sanity.io/docs/api/openapi/${options.slug}`
    const url = new URL(baseUrl)

    // Always set format parameter, defaulting to yaml
    const format = options.format || 'yaml'
    url.searchParams.set('format', format)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    if (response.status === 404) {
      output.error(`OpenAPI specification not found: ${options.slug}`)
      return null
    }

    if (!response.ok) {
      context.output.error('The OpenAPI service is currently unavailable. Please try again later.')
      process.exit(1)
    }

    const specContent = await response.text()
    return specContent
  } catch (error) {
    context.output.error('The OpenAPI service is currently unavailable. Please try again later.')
    process.exit(1)
    return null // satisfy TypeScript, though this line is unreachable
  }
}
