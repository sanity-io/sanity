const colorizeJson = require('../../util/colorizeJson')

const helpText = `
Examples
  # Get the document with the ID "myDocId"
  sanity documents get myDocId

  # ID wrapped in double or single quote works equally well
  sanity documents get 'myDocId'
`

export default {
  name: 'get',
  group: 'documents',
  signature: '[DOCUMENT_ID]',
  helpText,
  description: 'Get and print a document by ID',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const {pretty, dataset} = args.extOptions
    const [docId] = args.argsWithoutOptions

    if (!docId) {
      throw new Error('Document ID must be specified')
    }

    const client = dataset
      ? apiClient()
          .clone()
          .config({dataset})
      : apiClient()

    try {
      const doc = await client.getDocument(docId)
      if (!doc) {
        throw new Error('Document not found')
      }

      output.print(pretty ? colorizeJson(doc, chalk) : JSON.stringify(doc, null, 2))
    } catch (err) {
      throw new Error(`Failed to fetch document:\n${err.message}`)
    }
  }
}
