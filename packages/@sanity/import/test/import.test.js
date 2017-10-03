const fs = require('fs')
const path = require('path')
const sanityClient = require('@sanity/client')
const importer = require('../')

const client = sanityClient({
  projectId: 'foo',
  dataset: 'bar',
  useCdn: false,
  token: 'foo'
})

const options = {client}
const fixturesDir = path.join(__dirname, 'fixtures')
const getFixture = fix => {
  const fixPath = path.join(fixturesDir, `${fix}.ndjson`)
  return fs.createReadStream(fixPath, 'utf8')
}

test('rejects on invalid JSON', async () => {
  await expect(importer(getFixture('invalid-json'), options)).rejects.toHaveProperty(
    'message',
    'Failed to parse line #3: Unexpected token _ in JSON at position 1'
  )
})

test('rejects on missing `_id` property', async () => {
  await expect(importer(getFixture('invalid-id'), options)).rejects.toHaveProperty(
    'message',
    'Failed to parse line #2: Document contained an invalid "_id" property - must be a string'
  )
})

test('rejects on missing `_type` property', async () => {
  await expect(importer(getFixture('missing-type'), options)).rejects.toHaveProperty(
    'message',
    'Failed to parse line #3: Document did not contain required "_type" property of type string'
  )
})
