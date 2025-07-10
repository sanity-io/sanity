import {readDoc} from '../../actions/docs/readDoc'
import {type CliCommandDefinition} from '../../types'
import {browse} from '../../util/browse'

interface ReadCommandFlags {
  w?: boolean
  web?: boolean
}

/**
 * Normalizes input to a path, handling both paths and full Sanity docs URLs
 * @param input - Either a path like "/docs/studio" or full URL like "https://www.sanity.io/docs/studio"
 * @returns Normalized path starting with "/"
 */
export function normalizePath(input: string): string {
  const sanityDocsPrefix = 'https://www.sanity.io'
  if (input.startsWith(sanityDocsPrefix)) {
    return input.replace(sanityDocsPrefix, '')
  }
  return input
}

const helpText = `
Arguments
  <path> Path or URL to article, found in search results and docs content as links

Options
  -w, --web               Open in a web browser

Examples
  # Read as markdown in terminal
  sanity docs read /docs/studio/installation
  sanity docs read https://www.sanity.io/docs/studio/installation

  # Open in web browser
  sanity docs read /docs/studio/installation --web
  sanity docs read https://www.sanity.io/docs/studio/installation -w
`

const readCommand: CliCommandDefinition<ReadCommandFlags> = {
  name: 'read',
  group: 'docs',
  helpText,
  signature: '<path|url> [-w, --web]',
  description: 'Read an article in terminal',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as ReadCommandFlags
    const input = args.argsWithoutOptions[0]

    if (!input || typeof input !== 'string') {
      output.error('Please provide an article path or URL')
      output.print('')
      output.print(helpText)
      process.exit(1)
      return
    }

    // Normalize URL to path
    const path = normalizePath(input)

    // Validate the normalized path
    if (!path.startsWith('/')) {
      output.error('Invalid path or URL. Expected a Sanity docs path or URL.')
      output.print('Examples:')
      output.print('  /docs/studio/installation')
      output.print('  https://www.sanity.io/docs/studio/installation')
      process.exit(1)
      return
    }

    // Open in web browser if --web or -w flag is provided
    if (flags.web || flags.w) {
      const url = `https://www.sanity.io${path}`
      output.print(`Opening ${url}`)
      await browse(url)
      return
    }

    // Default behavior: read as markdown in terminal
    output.print(`Reading article: ${path}`)

    const content = await readDoc({path}, context)

    if (!content) {
      return // Error already handled in readDoc
    }

    // Display markdown content
    output.print('\n---\n')
    output.print(content)
  },
}

export default readCommand
