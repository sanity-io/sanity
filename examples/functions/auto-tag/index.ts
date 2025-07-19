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
      noWrite: local ? true : false,
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
    console.log(local ? 'Generated tags (LOCAL TEST MODE):' : 'Generated tags:', result.tags)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error occurred during tag generation:', error)
  }
})
