import {listPlatforms} from '../../actions/changelog/listPlatforms'
import {type CliCommandDefinition} from '../../types'
import {isInteractive} from '../../util/isInteractive'

interface ListCommandFlags {
  json?: boolean
}

const helpText = `
Options
  --json                  Output JSON

Examples
  # List all available platforms
  sanity changelog list

  # List with JSON output
  sanity changelog list --json
`

const listCommand: CliCommandDefinition<ListCommandFlags> = {
  name: 'list',
  group: 'changelog',
  helpText,
  signature: '[--json]',
  description: 'List all available changelog platforms',
  async action(args, context) {
    const {output} = context
    const flags = args.extOptions as ListCommandFlags

    if (isInteractive && !flags.json) {
      process.stderr.write('Fetching available platforms...\n')
    }

    await listPlatforms({json: flags.json}, context)
  },
}

export default listCommand
