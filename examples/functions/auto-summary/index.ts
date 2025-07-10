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
      const result = await client.agent.action.generate({
        // Set `noWrite` to `false` to write the tags to the document
        noWrite: true,
        instructionParams: {
          content: {
            type: 'field',
            path: 'body',
          },
        },
        instruction: `Based on the $content, write a summary no more than 250 words.`,
        target: {
          path: 'autoSummary',
        },
        documentId: data._id,
        schemaId: '_.schemas.default',
        forcePublishedWrite: true,
      })
      // eslint-disable-next-line no-console
      console.log('Generated summary:', result.autoSummary)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error occurred during summary generation:', error)
    }
  },
)
