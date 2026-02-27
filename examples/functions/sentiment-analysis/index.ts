import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

export const handler = documentEventHandler(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX', // vX currently required for Agent Actions
    useCdn: false,
  })
  const {data} = event
  const {local} = context // local is true when running locally

  try {
    const result = await client.agent.action.generate({
      noWrite: Boolean(local), // if local is true, we don't want to write to the document, just return the result for logging

      // Define which field to analyze
      instructionParams: {
        review: {
          type: 'field',
          path: 'review',
        },
      },

      instruction: `Analyze the sentiment of the $review and categorize it into one of these 5 levels: very_positive, positive, neutral, negative, very_negative. Consider the emotional tone, word choice, and overall sentiment expressed in the text. Return only the sentiment level as a string.`,

      target: {
        path: 'sentiment', // This is the field you want to write the sentiment to.
      },

      documentId: data._id,
      schemaId: '_.schemas.default', // This is the schemaId of the schema you want to use.  See run `npx sanity schema list` in your studio directory to get the schemaId. See README.md for more details.

      forcePublishedWrite: true, // Write to published document even if draft exists
    })

    console.log(
      local
        ? 'Analyzed sentiment (LOCAL TEST MODE - Content Lake not updated):'
        : 'Analyzed sentiment:',
      result.sentiment,
    )
  } catch (error) {
    console.error('Error occurred during sentiment analysis:', error)
  }
})
