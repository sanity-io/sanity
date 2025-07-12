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
        // Set `noWrite` to `false` to write the sentiment to the document
        noWrite: true,
        instructionParams: {
          content: {
            type: 'field',
            path: 'content',
          },
        },
        instruction: `Analyze the sentiment of the $content and categorize it into one of these 5 levels: very_positive, positive, neutral, negative, very_negative. Consider the emotional tone, word choice, and overall sentiment expressed in the text. Return only the sentiment level as a string.`,
        target: {
          path: 'sentiment',
        },
        documentId: data._id,
        schemaId: '_.schemas.default',
        forcePublishedWrite: true,
      })
      // eslint-disable-next-line no-console
      console.log('Analyzed sentiment:', result.sentiment)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error occurred during sentiment analysis:', error)
    }
  },
) 