import {createClient} from '@sanity/client'

const DOCUMENT_ID = 'referenceWithKeyContainingPeriods'

const client = createClient({
  projectId: 'ppsg7ml5',
  dataset: 'test',
  apiVersion: '2023-12-01',
  token: 'xxx',
  useCdn: false,
})

async function getAuthorReferences() {
  const authors = await client.fetch<string[]>('*[_type == "author"][0...10]._id')

  return authors.map((author) => ({
    _type: 'reference',
    _ref: author,
    _key: ['author', author].join('.'),
  }))
}

// Initial values cannot be set for an array entry's `_key` field. Instead, we must seed the data
// using the HTTP API.
async function main() {
  await client.create({
    _id: DOCUMENT_ID,
    _type: 'referenceWithKeyContainingPeriods',
    name: 'Test 1',
    authors: await getAuthorReferences(),
  })
}

main()
