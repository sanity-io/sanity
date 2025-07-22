import {getSpec} from '../../actions/openapi/getSpec'
import {type CliCommandDefinition} from '../../types'
import {isInteractive} from '../../util/isInteractive'

interface GetCommandFlags {
  format?: 'json' | 'yaml'
  w?: boolean
  web?: boolean
}

const helpText = `
Arguments
  <slug> Slug of the OpenAPI specification to retrieve

Options
  --format <format>       Output format: yaml (default), json
  -w, --web               Open in web browser

Examples
  # Get a specification (YAML format, default)
  sanity openapi get query

  # Get specification in JSON format
  sanity openapi get query --format=json

  # Open specification in browser
  sanity openapi get query --web
  sanity openapi get query -w

  # Pipe to file
  sanity openapi get query > query-api.yaml
`

const getCommand: CliCommandDefinition<GetCommandFlags> = {
  name: 'get',
  group: 'openapi',
  helpText,
  signature: '<slug> [--format <format>] [-w, --web]',
  description: 'Get an OpenAPI specification by slug',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as GetCommandFlags
    const slug = args.argsWithoutOptions[0]

    if (!slug || typeof slug !== 'string') {
      output.error('Please provide a specification slug')
      output.print('')
      output.print(helpText)
      process.exit(1)
      return
    }

    // Validate format option
    if (flags.format && !['json', 'yaml'].includes(flags.format)) {
      output.error('Invalid format. Supported formats: json, yaml')
      output.print('')
      output.print(helpText)
      process.exit(1)
      return
    }

    // Open in web browser if --web or -w flag is provided
    if (flags.web || flags.w) {
      await getSpec({slug, web: true}, context)
      return
    }

    if (isInteractive) {
      process.stderr.write(`Fetching OpenAPI specification: ${slug}\n`)
    }

    const content = await getSpec(
      {
        slug,
        format: flags.format || 'yaml',
      },
      context,
    )

    if (!content) {
      return // Error already handled in getSpec
    }

    // Output the specification content directly (pipeable)
    output.print(content)
  },
}

export default getCommand
