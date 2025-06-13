import {createClient} from '@sanity/client'
import {type DocumentEvent, documentEventHandler, type FunctionContext} from '@sanity/functions'

export const handler = documentEventHandler(
  async ({context, event}: {context: FunctionContext; event: DocumentEvent}) => {
    const client = createClient({
      ...context.clientOptions,
      dataset: 'production',
      apiVersion: 'vX',
      useCdn: false,
    })
    const {data} = event

    try {
      const result = await client.patch(data._id, {
        setIfMissing: {
          firstPublished: new Date().toISOString(),
        },
      })
      // eslint-disable-next-line no-console
      console.log('Set firstPublished timestamp for document:', data._id, result)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error setting firstPublished timestamp:', error)
    }
  },
)
