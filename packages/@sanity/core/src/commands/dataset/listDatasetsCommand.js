import listAliasesHandler from './alias/listAliasesHandler'

export default {
  name: 'list',
  group: 'dataset',
  signature: '',
  description: 'List datasets and dataset aliases of your project',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient()
    const datasets = await client.datasets.list()
    output.print(datasets.map((set) => set.name).join('\n'))

    // Print alias list
    await listAliasesHandler(args, context)
  },
}
