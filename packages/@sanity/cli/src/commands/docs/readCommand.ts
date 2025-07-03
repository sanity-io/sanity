import {readDoc} from '../../actions/docs/readDoc'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Arguments
  <slug> Slug of the documentation article

Examples
  # Read a documentation article
  sanity docs read "studio-overview"

  # Read a getting started guide
  sanity docs read "getting-started"
`

const readCommand: CliCommandDefinition = {
  name: 'read',
  group: 'docs',
  helpText,
  signature: '<slug>',
  description: 'Read a specific documentation article in markdown format',
  async action(args, context) {
    const {output} = context
    const slug = args.argsWithoutOptions[0]

    if (!slug) {
      output.error('Please provide a documentation slug')
      output.print('Usage: sanity docs read "article-slug"')
      output.print('Example: sanity docs read "studio-overview"')
      return
    }

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
