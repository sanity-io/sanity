import type {CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  --type <type> Type of migration (incremental/full)

Examples
  sanity migration create
  sanity migration create <name>
  sanity migration create <name> --type incremental
`

const allowedTypes = ['incremental', 'full']

interface MigrateFlags {
  type?: 'incremental'
}

const createMigrationCommand: CliCommandDefinition<MigrateFlags> = {
  name: 'create',
  group: 'migration',
  signature: '[NAME]',
  helpText,
  description: 'Create a new content migration within your project',
  action: async (args, context) => {
    const {output, prompt} = context
    const flags = args.extOptions

    output.print('scaffold %s migration', flags.type || 'incremental')
  },
}
export default createMigrationCommand
