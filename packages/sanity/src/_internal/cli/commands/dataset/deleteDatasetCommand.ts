import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import type {CliCommandDefinition} from '@sanity/cli'
import {validateDatasetName} from '../../actions/dataset/validateDatasetName'

const helpText = `
Options
  --force Do not prompt for delete confirmation - forcefully delete

Examples
  sanity dataset delete
  sanity dataset delete my-dataset
  sanity dataset delete my-dataset --force
`

function parseCliFlags(args: {argv?: string[]}) {
  return yargs(hideBin(args.argv || process.argv).slice(2)).option('force', {type: 'boolean'}).argv
}

interface DeleteDatasetFlags {
  force?: boolean
}

const deleteDatasetCommand: CliCommandDefinition<DeleteDatasetFlags> = {
  name: 'delete',
  group: 'dataset',
  helpText,
  signature: '[datasetName]',
  description: 'Delete a dataset within your project',
  action: async (args, context) => {
    const {apiClient, prompt, output} = context
    const {force} = await parseCliFlags(args)
    const [ds] = args.argsWithoutOptions
    if (!ds) {
      throw new Error('Dataset name must be provided')
    }

    const dataset = `${ds}`
    const dsError = validateDatasetName(dataset)
    if (dsError) {
      throw dsError
    }

    if (force) {
      output.warn(`'--force' used: skipping confirmation, deleting dataset "${dataset}"`)
    } else {
      await prompt.single({
        type: 'input',
        message:
          'Are you ABSOLUTELY sure you want to delete this dataset?\n  Type the name of the dataset to confirm delete:',
        filter: (input) => `${input}`.trim(),
        validate: (input) => {
          return input === dataset || 'Incorrect dataset name. Ctrl + C to cancel delete.'
        },
      })
    }

    await apiClient().datasets.delete(dataset)
    output.print('Dataset deleted successfully')
  },
}

export default deleteDatasetCommand
