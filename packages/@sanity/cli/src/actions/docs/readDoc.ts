import {type CliCommandContext} from '../../types'

interface ReadDocOptions {
  path: string
}

export async function readDoc(
  options: ReadDocOptions,
  context: CliCommandContext,
): Promise<string | null> {
  const {output} = context

  try {
    // Use production docs URL with .md extension
    const url = `https://www.sanity.io${options.path}.md`

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    if (response.status === 404) {
      output.error(`Article not found: ${options.path}`)
      return null
    }

    if (!response.ok) {
      context.output.error(`The article API is currently unavailable. Please try again later.`)
      process.exit(1)
    }

    const markdownContent = await response.text()
    return markdownContent
  } catch (error) {
    context.output.error(`The article API is currently unavailable. Please try again later.`)
    process.exit(1)
    return null // satisfy TypeScript, though this line is unreachable
  }
}
