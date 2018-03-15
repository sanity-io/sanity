/* eslint-disable no-sync */
const fs = require('fs')
const path = require('path')
const sanityClient = require('@sanity/client')
const {getSanityClient} = require('./helpers')
const importer = require('../')

const defaultClient = sanityClient({
  projectId: 'foo',
  dataset: 'bar',
  useCdn: false,
  token: 'foo'
})

const uuidMatcher = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/
const importOptions = {client: defaultClient}
const fixturesDir = path.join(__dirname, 'fixtures')
const getFixturePath = fix => path.join(fixturesDir, `${fix}.ndjson`)
const getFixtureStream = fix => fs.createReadStream(getFixturePath(fix), 'utf8')
const getFixtureArray = fix =>
  fs
    .readFileSync(getFixturePath(fix), 'utf8')
    .trim()
    .split('\n')
    .map(JSON.parse)

test('rejects on invalid input type (null/undefined)', async () => {
  await expect(importer(null, importOptions)).rejects.toHaveProperty(
    'message',
    'Stream does not seem to be a readable stream or an array'
  )
})

test('rejects on invalid input type (non-array)', async () => {
  await expect(importer({}, importOptions)).rejects.toHaveProperty(
    'message',
    'Stream does not seem to be a readable stream or an array'
  )
})

test('rejects on invalid JSON', async () => {
  await expect(importer(getFixtureStream('invalid-json'), importOptions)).rejects.toHaveProperty(
    'message',
    'Failed to parse line #3: Unexpected token _ in JSON at position 1'
  )
})

test('rejects on invalid `_id` property', async () => {
  await expect(importer(getFixtureStream('invalid-id'), importOptions)).rejects.toHaveProperty(
    'message',
    'Failed to parse line #2: Document contained an invalid "_id" property - must be a string'
  )
})

test('rejects on invalid `_id` property format', async () => {
  await expect(
    importer(getFixtureStream('invalid-id-format'), importOptions)
  ).rejects.toHaveProperty(
    'message',
    'Failed to parse line #2: Document ID "pk#123" is not valid: Please use alphanumeric document IDs. Dashes (-) and underscores (_) are also allowed.'
  )
})

test('rejects on missing `_type` property', async () => {
  await expect(importer(getFixtureStream('missing-type'), importOptions)).rejects.toHaveProperty(
    'message',
    'Failed to parse line #3: Document did not contain required "_type" property of type string'
  )
})

test('rejects on missing `_type` property (from array)', async () => {
  await expect(importer(getFixtureArray('missing-type'), importOptions)).rejects.toHaveProperty(
    'message',
    'Failed to parse document at index #2: Document did not contain required "_type" property of type string'
  )
})

test('accepts an array as source', async () => {
  const docs = getFixtureArray('employees')
  const client = getSanityClient(getMockMutationHandler())
  const res = await importer(docs, {client})
  expect(res).toBe(2)
})

test('accepts a stream as source', async () => {
  const client = getSanityClient(getMockMutationHandler())
  const res = await importer(getFixtureStream('employees'), {client})
  expect(res).toBe(2)
})

test('generates uuids for documents without id', async () => {
  const match = body => {
    expect(body.mutations[0].create._id).toMatch(uuidMatcher)
    expect(body.mutations[1].create._id).toBe('pk')
    expect(body.mutations[2].create._id).toMatch(uuidMatcher)
  }

  const client = getSanityClient(getMockMutationHandler(match))
  const res = await importer(getFixtureStream('valid-but-missing-ids'), {client})
  expect(res).toBe(3)
})

function getMockMutationHandler(match = 'employee creation') {
  return req => {
    const options = req.context.options
    const uri = options.uri || options.url

    if (uri.includes('/data/mutate')) {
      const body = JSON.parse(options.body)

      if (typeof match === 'function') {
        match(body)
      } else {
        expect(body).toMatchSnapshot(match)
      }

      const results = body.mutations.map(mut => ({
        id: mut.create.id,
        operation: 'create'
      }))
      return {body: {results}}
    }

    return {statusCode: 400, body: {error: `"${uri}" should not be called`}}
  }
}
