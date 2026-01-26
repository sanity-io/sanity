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
          path: 'content',
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
    console.log(
      local ? 'Generated tags (LOCAL TEST MODE - Content Lake not updated):' : 'Generated tags:',
      result.tags,
    )
  } catch (error) {
    console.error('Error occurred during tag generation:', error)
  }
})
