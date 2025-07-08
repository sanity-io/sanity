import {readDoc} from '../../actions/docs/readDoc'
import {type CliCommandDefinition} from '../../types'
import {browse} from '../../util/browse'

interface ReadCommandFlags {
  w?: boolean
  web?: boolean
}

const helpText = `
Arguments
  <path> Path to article, found in search results and docs content as links

Options
  -w, --web               Open in a web browser

Examples
  # Read as markdown in terminal
  sanity docs read /docs/studio/installation

  # Open in web browser
  sanity docs read /docs/studio/installation --web
  sanity docs read /docs/studio/installation -w
`

const readCommand: CliCommandDefinition<ReadCommandFlags> = {
  name: 'read',
  group: 'docs',
  helpText,
  signature: '<path> [-w, --web]',
  description: 'Read a specific article',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as ReadCommandFlags
    const path = args.argsWithoutOptions[0]

    if (!path || typeof path !== 'string') {
      output.error('Please provide an article path')
      output.print('')
      output.print(helpText)
      process.exit(1)
      return
    }

    if (!path.startsWith('/')) {
      output.error('Article path must start with a forward slash (/)')
      output.print('')
      output.print(helpText)
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
