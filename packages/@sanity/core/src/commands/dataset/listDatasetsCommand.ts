import type {CliCommandDefinition} from '@sanity/cli'
import {listAliasesHandler} from './alias/listAliasesHandler'

const listDatasetsCommand: CliCommandDefinition = {
  name: 'list',
  group: 'dataset',
  helpText: '',
  signature: '',
  description: 'List datasets of your project',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient()
    const datasets = await client.datasets.list()
    output.print(datasets.map((set) => set.name).join('\n'))

    // Print alias list
    await listAliasesHandler(args, context)
  },
}

export default listDatasetsCommand
