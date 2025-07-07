import {readDoc} from '../../actions/docs/readDoc'
import {type CliCommandDefinition} from '../../types'

interface ReadCommandFlags {
  w?: boolean
  web?: boolean
}

const helpText = `
Arguments
  <path> Article path

Options
  -w, --web               Open the article in a web browser

Examples
  # Read article as markdown in terminal
  sanity docs read "/docs/studio/installation"

  # Open article in web browser
  sanity docs read "/docs/studio/installation" --web
  sanity docs read "/docs/studio/installation" -w
`

const readCommand: CliCommandDefinition<ReadCommandFlags> = {
  name: 'read',
  group: 'docs',
  helpText,
  signature: '<path> [-w, --web]',
  description: 'Read an article',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as ReadCommandFlags
    const path = args.argsWithoutOptions[0]

    if (!path) {
      output.error('Please provide an article path')
      output.print('')
      output.print(helpText)
      process.exit(1)
    }

    if (!path.startsWith('/')) {
      output.error('Article path must start with a forward slash (/)')
      output.print('')
      output.print(helpText)
      process.exit(1)
    }

    // Open in web browser if --web or -w flag is provided
    if (flags.web || flags.w) {
      const url = `https://www.sanity.io${path}`
      output.print(`Opening ${url}`)

      const {default: open} = await import('open')
      await open(url)
      return
    }

    // Default behavior: read as markdown in terminal
    output.print(`Reading documentation: ${path}`)

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
