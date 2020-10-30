export default {
  name: 'list',
  group: 'dataset-alias',
  signature: '',
  description: 'List dataset aliases of your project',
  action: async (args, context) => {
    const {apiClient, output} = context
    const client = apiClient()
    console.log(client)
    const aliases = await client.datasetAliases.list()
    output.print(aliases.map(set => set.name).join('\n'))
  }
}
