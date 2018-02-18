/* eslint-disable no-sync, import/no-dynamic-require */
const fs = require('fs')
const path = require('path')
const getClient = require('@sanity/client')
const diffPatch = require('../src/diff-patch')

/* eslint-disable no-process-env */
const projectId = process.env.SANITY_TEST_PROJECT_ID
const dataset = process.env.SANITY_TEST_DATASET
const token = process.env.SANITY_TEST_TOKEN
/* eslint-enable no-process-env */

const describeIt = projectId && dataset && token ? describe : describe.skip

describeIt('integration tests', () => {
  const client = getClient({projectId, dataset, token, useCdn: false})
  const fixturesDir = path.join(__dirname, 'fixtures', 'integration')
  fs.readdirSync(fixturesDir)
    .filter(file => /^\d+\.json$/.test(file))
    .map(file => ({file, fixture: require(path.join(fixturesDir, file))}))
    .forEach(fix =>
      test(fix.file, async () => {
        const _id = `fix-${fix.file}`.replace(/[^a-z0-9-]+/gi, '-')
        const input = Object.assign({}, fix.fixture.input, {_id})
        const output = Object.assign({}, fix.fixture.output, {_id})
        const diff = diffPatch(input, output)

        console.log(diff)

        await client
          .transaction()
          .createOrReplace(input)
          .patch(_id, diff)
          .commit({visibility: 'sync'})

        expect(await client.getDocument(_id)).toMatchObject(output)
      })
    )
})
