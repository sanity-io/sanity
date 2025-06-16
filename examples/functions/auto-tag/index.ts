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
          tagsUsedInOtherPosts: {
            type: 'groq',
            query: "array::unique(*[_type == 'post' && _id != $id && defined(tags)].tags[])",
            params: {
              id: data._id,
            },
          },
        },
        instruction: `Based on the $content, create 3 relevant tags. Attempt to use $tagsUsedInOtherPosts first if they fit the context. Tags should be simple lowercase words strings and no brackets.`,
        target: {
          path: 'tags',
        },
        documentId: data._id,
        schemaId: '_.schemas.default',
        forcePublishedWrite: true,
      })
      // eslint-disable-next-line no-console
      console.log('Generated tags:', result.tags)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error occurred during tag generation:', error)
    }
  },
)
