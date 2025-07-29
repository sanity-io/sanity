import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

export const handler = documentEventHandler(async ({context, event}) => {
  const {local} = context // local is true when running locally
  const {data} = event

  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })

  try {
    const result = await client.agent.action.generate({
      // Set `noWrite` to `false` to write the tone of voice to the document
      noWrite: local ? true : false, // if local is true, we don't want to write to the document, just return the result for logging
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
      documentId: data._id,
      schemaId: '_.schemas.default',
      forcePublishedWrite: true,
    })
    console.log(
      local
        ? 'Generated tone analysis (LOCAL TEST MODE - Content Lake not updated):'
        : 'Generated tone analysis:',
      result.toneOfVoice,
    )
  } catch (error) {
    console.error('Error occurred during tone of voice generation:', error)
  }
})
