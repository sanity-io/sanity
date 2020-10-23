export default {
  name: 'list',
  group: 'dataset',
  signature: '',
  description: 'List dataset aliases of your project',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient()
    const aliases = await client.datasetAliases.list()
    output.print(aliases.map(set => set.name).join('\n'))
  }
}
