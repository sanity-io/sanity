import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

export const handler = documentEventHandler(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: '2025-07-17',
    useCdn: false,
  })
  const {data} = event
  const {local} = context // local is true when running locally

  try {
    const firstPublishedDate = new Date().toISOString()
    const result = await client
      .patch(data._id)
      .setIfMissing({
        firstPublished: firstPublishedDate,
      })
      .commit({dryRun: local})
    console.log(
      local
        ? `(LOCAL TEST MODE - Content Lake not updated) Set firstPublished timestamp for document (${data._id}): ${firstPublishedDate}  `
        : `Set firstPublished timestamp for document (${data._id}): ${firstPublishedDate}`,
      result,
    )
  } catch (error) {
    console.error('Error setting firstPublished timestamp:', error)
  }
})
