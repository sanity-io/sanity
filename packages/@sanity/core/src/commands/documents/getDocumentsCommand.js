const colorizeJson = require('../../util/colorizeJson')

export default {
  name: 'get',
  group: 'documents',
  signature: '[DOCUMENT_ID]',
  description: 'Get and print a document',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const {pretty} = args.extOptions
    const [docId] = args.argsWithoutOptions
    const client = apiClient()

    if (!docId) {
      throw new Error('Document ID must be specified')
    }

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

