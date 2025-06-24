import {createClient} from '@sanity/client'
import {type DocumentEvent, documentEventHandler, type FunctionContext} from '@sanity/functions'

export const handler = documentEventHandler(
  async ({context, event}: {context: FunctionContext; event: DocumentEvent}) => {
    // eslint-disable-next-line no-console
    console.log('Event data:', JSON.stringify(event.data, null, 2))

    const client = createClient({
      ...context.clientOptions,
      apiVersion: 'vX',
      useCdn: false,
      dataset: 'production',
    })

    try {
      const result = await client.agent.action.generate({
        // Set `noWrite` to `false` to write the tone of voice to the document
        noWrite: true,
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
        forcePublishedWrite: true,
      })
      // eslint-disable-next-line no-console
      console.log('Successfully generated tone of voice analysis:', result.toneOfVoice)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error occurred during tone of voice generation:', error)
    }
  },
)
