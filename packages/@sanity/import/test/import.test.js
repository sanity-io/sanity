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
  const client = getSanityClient(getMockEmployeeHandler())
  const res = await importer(docs, {client})
  expect(res).toBe(2)
})

test('accepts a stream as source', async () => {
  const client = getSanityClient(getMockEmployeeHandler())
  const res = await importer(getFixtureStream('employees'), {client})
  expect(res).toBe(2)
})

function getMockEmployeeHandler() {
  return req => {
    const options = req.context.options
    const uri = options.uri || options.url

    if (uri.includes('/data/mutate')) {
      const body = JSON.parse(options.body)
      expect(body).toMatchSnapshot('employee creation')
      const results = body.mutations.map(mut => ({
        id: mut.create.id,
        operation: 'create'
      }))
      return {body: {results}}
    }

    return {statusCode: 400, body: {error: `"${uri}" should not be called`}}
  }
}
