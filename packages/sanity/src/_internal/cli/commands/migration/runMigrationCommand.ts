import type {CliCommandDefinition} from '@sanity/cli'
import {promptForDatasetName} from '../../actions/dataset/datasetNamePrompt'
import {validateDatasetName} from '../../actions/dataset/validateDatasetName'

const helpText = `
Options
  --dryRun <boolean> Whether or not to dry run the migration. Default to true, to actually run the migration this has to be set to false

Examples
  sanity migration run
  sanity migration run <name>
  sanity migration run <name> --dryRun false --projectId xyz --dataset staging
`

const allowedModes = ['private', 'public', 'custom']

interface CreateFlags {
  dryRun?: boolean
}

const createMigrationCommand: CliCommandDefinition<CreateFlags> = {
  name: 'run',
  group: 'migration',
  signature: '[NAME] [MIGRATION_FILE]',
  helpText,
  description: 'Run a migration against a dataset',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const [dataset] = args.argsWithoutOptions
    const client = apiClient()

    const nameError = dataset && validateDatasetName(dataset)
    if (nameError) {
      throw new Error(nameError)
    }

    const [datasets, projectFeatures] = await Promise.all([
      client.datasets.list().then((sets) => sets.map((ds) => ds.name)),
      client.request({uri: '/features'}),
    ])

    const datasetName = await (dataset || promptForDatasetName(prompt))

    // todo: find migration and run it

    try {
      await client.datasets.create(datasetName)
      output.print('Dataset created successfully')
    } catch (err) {
      throw new Error(`Dataset creation failed:\n${err.message}`)
    }
  },
}
export default createMigrationCommand
