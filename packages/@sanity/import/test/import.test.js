require('hard-rejection/register')

const fs = require('fs')
const path = require('path')
const importer = require('../')

const fixturesDir = path.join(__dirname, 'fixtures')
const getFixture = fix => {
  const fixPath = path.join(fixturesDir, `${fix}.ndjson`)
  return fs.createReadStream(fixPath, 'utf8')
}

test('rejects on invalid JSON', async () => {
  await expect(importer(getFixture('invalid-json'))).rejects.toHaveProperty(
    'message',
    'Failed to parse line #3: Unexpected token _ in JSON at position 1'
  )
})

test('rejects on missing `_id` property', async () => {
  await expect(importer(getFixture('missing-id'))).rejects.toHaveProperty(
    'message',
    'Failed to parse line #2: Document did not contain required "_id" property of type string'
  )
})

test('rejects on missing `_type` property', async () => {
  await expect(importer(getFixture('missing-type'))).rejects.toHaveProperty(
    'message',
    'Failed to parse line #3: Document did not contain required "_type" property of type string'
  )
})

test('@temp@', async () => {
  /* eslint-disable */
  try {
    const res = await importer(getFixture('unkeyed'))
    console.log(require('util').inspect(res, {colors: true, depth: 5}))
  } catch (err) {
    consol.error(err.stack)
  }
  /* eslint-enable */
})
