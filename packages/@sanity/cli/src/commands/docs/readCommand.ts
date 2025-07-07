import {readDoc} from '../../actions/docs/readDoc'
import {type CliCommandDefinition} from '../../types'

interface ReadCommandFlags {
  w?: boolean
  web?: boolean
}

const helpText = `
Arguments
  <slug> Full path of the documentation article

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
  signature: '<slug> [-w, --web]',
  description: 'Read a documentation article',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as ReadCommandFlags
    const slug = args.argsWithoutOptions[0]

    if (!slug) {
      output.error('Please provide a documentation slug')
      output.print('Usage: sanity docs read "article-slug"')
      output.print('Example: sanity docs read "/docs/studio/installation"')
      return
    }

    // Open in web browser if --web or -w flag is provided
    if (flags.web || flags.w) {
      const url = `https://www.sanity.io${slug}`
      output.print(`Opening ${url}`)

      const {default: open} = await import('open')
      await open(url)
      return
    }

    // Default behavior: read as markdown in terminal
    output.print(`Reading documentation: ${slug}`)

    const content = await readDoc({slug}, context)

    if (!content) {
      return // Error already handled in readDoc
    }

    // Display markdown content
    output.print('\n---\n')
    output.print(content)
  },
}

export default readCommand
