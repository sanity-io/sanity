export default {
  name: 'delete',
  group: 'documents',
  signature: '[ID]',
  description: 'Delete a document by ID',
  action: async (args, context) => {
    const {apiClient, output} = context
    const {dataset} = args.extOptions
    const [id] = args.argsWithoutOptions

    if (!id) {
      throw new Error('Document ID must be specified')
    }

    const client = dataset
      ? apiClient()
          .clone()
          .config({dataset})
      : apiClient()

    try {
      const {results} = await client.delete(id)
      if (results.length > 0 && results[0].operation === 'delete') {
        output.print('Document deleted')
      } else {
        output.print(`Document with ID "${id}" not found`)
      }
    } catch (err) {
      throw new Error(`Failed to delete document:\n${err.message}`)
    }
  }
}
