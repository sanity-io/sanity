const colorizeJson = require('../../util/colorizeJson')

const help = `
Runs a query against the projects configured dataset. Specify --pretty to get
colorized JSON output. Example:

  sanity documents query '*[_type == "movie"][0...5]'

Will fetch 5 documents of type "movie"
`

export default {
  name: 'query',
  group: 'documents',
  signature: '[QUERY]',
  description: 'Query for documents',
  helpText: help,
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const {pretty, dataset} = args.extOptions
    const [query] = args.argsWithoutOptions

    if (!query) {
      throw new Error('Query must be specified')
    }

    const client = dataset
      ? apiClient()
          .clone()
          .config({dataset})
      : apiClient()

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
