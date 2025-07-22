import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

export const handler = documentEventHandler(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })
  const {data} = event
  const {local} = context // local is true when running locally

  try {
    const result = await client.agent.action.generate({
      noWrite: local ? true : false, // if local is true, we don't want to write to the document, just return the result for logging
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
    console.log(
      local
        ? 'Generated summary (LOCAL TEST MODE - Content Lake not updated):'
        : 'Generated summary:',
      result.autoSummary,
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error occurred during summary generation:', error)
  }
})
