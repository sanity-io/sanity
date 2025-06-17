import {createClient} from '@sanity/client'
import {type DocumentEvent, documentEventHandler, type FunctionContext} from '@sanity/functions'

export const handler = documentEventHandler(
  async ({context, event}: {context: FunctionContext; event: DocumentEvent}) => {
    // Client for the "production" dataset
    const client = createClient({
      ...context.clientOptions,
      apiVersion: 'vX',
    })

    // Agent action to generate the tone of voice for the post
    const generateToneOfVoice = await client.agent.action.generate({
      // Set `noWrite` to `false` to write the tone of voice to the document
      noWrite: true,
      instructionParams: {
        content: {
          type: 'field',
          path: 'body',
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

    try {
      if (!generateToneOfVoice?.toneOfVoice) {
        throw new Error('Failed to generate tone of voice analysis')
      }

      // eslint-disable-next-line no-console
      console.log('Successfully generated tone of voice analysis')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating tone of voice:', error)
      throw error
    }
  },
)
