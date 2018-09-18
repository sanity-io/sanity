const colorizeJson = require('../../util/colorizeJson')

const helpText = `
Run a query against the projects configured dataset

Options
  --pretty colorized JSON output
  --dataset NAME to override dataset

Examples
  # Fetch 5 documents of type "movie"
  sanity documents query '*[_type == "movie"][0..4]'

  # Fetch title of the oldest movie in the dataset named "staging"
  sanity documents query '*[_type == "movie"]|order(releaseDate asc)[0]{title}' --dataset staging
`

export default {
  name: 'query',
  group: 'documents',
  signature: '[QUERY]',
  helpText,
  description: 'Query for documents',
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
