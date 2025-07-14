import {createClient} from '@sanity/client'
import {type DocumentEvent, documentEventHandler, type FunctionContext} from '@sanity/functions'

export const handler = documentEventHandler(
  async ({context, event}: {context: FunctionContext; event: DocumentEvent}) => {
    // eslint-disable-next-line no-console
    console.log('Event data:', JSON.stringify(event.data, null, 2))
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
          review: {
            type: 'field',
            path: 'review', // This is the field you want to analyze.
          },
        },
        instruction: `Analyze the sentiment of the $review and categorize it into one of these 5 levels: very_positive, positive, neutral, negative, very_negative. Consider the emotional tone, word choice, and overall sentiment expressed in the text. Return only the sentiment level as a string.`,
        target: {
          path: 'sentiment', // This is the field you want to write the sentiment to.
        },
        documentId: data._id,
        schemaId: '_.schemas.default', // This is the schemaId of the schema you want to use.  See run `npx sanity schema list` in your studio directory to get the schemaId. See README.md for more details.
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
