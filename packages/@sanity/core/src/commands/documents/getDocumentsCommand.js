const util = require('util')

const inspect = doc => util.inspect(doc, {colors: true, depth: +Infinity})

export default {
  name: 'get',
  group: 'documents',
  signature: '[DOCUMENT_ID]',
  description: 'Get and print a document',
  action: async (args, context) => {
    const {apiClient, output} = context
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

      output.print(pretty ? inspect(doc) : JSON.stringify(doc, null, 2))
    } catch (err) {
      throw new Error(`Failed to fetch document:\n${err.message}`)
    }
  }
}

