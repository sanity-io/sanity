import {listSpecs} from '../../actions/openapi/listSpecs'
import {type CliCommandDefinition} from '../../types'
import {isInteractive} from '../../util/isInteractive'

interface ListCommandFlags {
  json?: boolean
  w?: boolean
  web?: boolean
}

const helpText = `
Options
  --json                  Output JSON
  -w, --web               Open HTTP Reference in web browser

Examples
  # List all available OpenAPI specs
  sanity openapi list

  # List with JSON output
  sanity openapi list --json

  # Open HTTP Reference in browser
  sanity openapi list --web
  sanity openapi list -w
`

const listCommand: CliCommandDefinition<ListCommandFlags> = {
  name: 'list',
  group: 'openapi',
  helpText,
  signature: '[--json] [-w, --web]',
  description: 'List all available OpenAPI specifications',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as ListCommandFlags

    // Open in web browser if --web or -w flag is provided
    if (flags.web || flags.w) {
      await listSpecs({web: true}, context)
      return
    }

    if (isInteractive) {
      process.stderr.write('Fetching available OpenAPI specifications...\n')
    }

    const specs = await listSpecs({}, context)

    if (specs.length === 0) {
      output.print('No OpenAPI specifications found.')
      return
    }

    // JSON output for scripting
    if (flags.json) {
      output.print(JSON.stringify(specs, null, 2))
      return
    }

    // Human-readable table format
    output.print(`\nFound ${specs.length} OpenAPI specification(s):\n`)

    specs.forEach((spec) => {
      output.print(`Title: ${spec.title}`)
      output.print(`Slug: ${spec.slug}`)
      if (spec.description) {
        output.print(`Description: ${spec.description}`)
      }
      output.print('')
    })

    output.print(`Use 'sanity openapi get <slug>' to retrieve a specific specification.`)
  },
}

export default listCommand
