const colorizeJson = require('../../util/colorizeJson')

export default {
  name: 'query',
  group: 'documents',
  signature: '[QUERY]',
  description: 'Query for documents',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const {pretty} = args.extOptions
    const [query] = args.argsWithoutOptions
    const client = apiClient()

    if (!query) {
      throw new Error('Query must be specified')
    }

    try {
      const docs = await client.fetch(query)
      if (!docs) {
        throw new Error('Query returned no results')
      }

      output.print(pretty ? colorizeJson(docs, chalk) : JSON.stringify(docs, null, 2))
    } catch (err) {
      throw new Error(`Failed to run query:\n${err.message}`)
    }
  }
}

