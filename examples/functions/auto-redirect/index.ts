import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

export const handler = documentEventHandler(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    useCdn: false,
    apiVersion: '2025-05-08',
  })

  const {beforeSlug, slug} = event.data

  if (!slug || !beforeSlug) {
    console.log('No slug or beforeSlug')
    return
  }
  if (slug === beforeSlug) {
    console.log('Slug did not change')
    return
  }
  // check if redirect already exists
  const existingRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == "${beforeSlug}"][0]`,
  )
  if (existingRedirect) {
    console.log(`Redirect already exists for source ${beforeSlug}`)
    return
  }
  // check for loops
  const loopRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == "${slug}" && destination.current == "${beforeSlug}"][0]`,
  )
  if (loopRedirect) {
    console.log('Redirect loop detected')
    return
  }
  const redirect = {
    _type: 'redirect',
    source: {
      current: beforeSlug,
    },
    destination: {
      current: slug,
    },
    permanent: true,
  }

  try {
    const res = await client.create(redirect)
    console.log(`🔗 Redirect from ${beforeSlug} to ${slug} was created ${JSON.stringify(res)}`)
  } catch (error) {
    console.log(error)
  }
})
