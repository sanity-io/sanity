import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

export const handler = documentEventHandler(async ({context, event}) => {
  // eslint-disable-next-line no-console
  console.log('Event data:', JSON.stringify(event.data, null, 2))

  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })
  const {local} = context // local is true when running locally

  try {
    const result = await client.agent.action.generate({
      // Set `noWrite` to `false` to write the tone of voice to the document
      noWrite: local ? true : false,
      instructionParams: {
        content: {
          type: 'field',
          path: 'content',
        },
      },
      instruction: `Examine the $content. Explain the tone of voice for the post.`,
      target: {
        path: 'toneOfVoice',
      },
      conditionalPaths: {
        defaultReadOnly: false,
      },
      documentId: event.data._id,
      schemaId: '_.schemas.default',
    })
    // eslint-disable-next-line no-console
    console.log(
      local ? 'Generated tone analysis (LOCAL TEST MODE):' : 'Generated tone analysis:',
      result.toneOfVoice,
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error occurred during tone of voice generation:', error)
  }
})
