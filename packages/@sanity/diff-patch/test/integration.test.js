/* eslint-disable no-sync, import/no-dynamic-require, max-nested-callbacks */
const fs = require('fs')
const path = require('path')
const omit = require('lodash.omit')
const PQueue = require('p-queue')
const getClient = require('@sanity/client')
const diffPatch = require('../src/diff-patch')

/* eslint-disable no-process-env */
const projectId = process.env.SANITY_TEST_PROJECT_ID
const dataset = process.env.SANITY_TEST_DATASET
const token = process.env.SANITY_TEST_TOKEN
/* eslint-enable no-process-env */

const ignoredKeys = ['_type', '_createdAt', '_updatedAt', '_rev']
const queue = new PQueue({concurrency: 4})
const describeIt = projectId && dataset && token ? describe : describe.skip

describeIt('integration tests', () => {
  const client = getClient({projectId, dataset, token, useCdn: false})
  const fixturesDir = path.join(__dirname, 'fixtures')
  const jsonFixturesDir = path.join(fixturesDir, 'integration')

  const jsonFixtures = fs
    .readdirSync(jsonFixturesDir)
    .filter(file => /^\d+\.json$/.test(file))
    .map(file => ({file, fixture: require(path.join(jsonFixturesDir, file))}))

  const jsFixtures = fs
    .readdirSync(fixturesDir)
    .filter(file => /\.js$/.test(file))
    .map(file => ({file, fixture: require(path.join(fixturesDir, file))}))
    .reduce((acc, item) => {
      const entries = Object.keys(item.fixture)
      return acc.concat(
        entries.reduce((set, key, i) => {
          for (let x = 0; x < entries.length; x++) {
            const input = item.fixture[key]
            const output = item.fixture[entries[x]]
            const name = `${item.file} (${key} vs ${entries[x]})`
            set.push({file: item.file, name, fixture: {input, output}})
          }

          return set
        }, [])
      )
    }, [])

  const fixtures = jsonFixtures.concat(jsFixtures)

  fixtures.forEach(fix =>
    test(fix.name || fix.file, async () => {
      const _type = 'test'
      const _id = `fix-${fix.name || fix.file}`
        .replace(/[^a-z0-9-]+/gi, '-')
        .replace(/(^-|-$)/g, '')

      const input = Object.assign({}, fix.fixture.input, {_id, _type})
      const output = Object.assign({}, fix.fixture.output, {_id, _type})
      const diff = diffPatch(input, output)

      const trx = client
        .transaction()
        .createOrReplace(input)
        .serialize()

      const result = await queue.add(() =>
        client.transaction(trx.concat(diff)).commit({visibility: 'async', returnDocuments: true})
      )

      expect(omit(result[0], ignoredKeys)).toMatchObject(omit(output, ignoredKeys))
    })
  )
})
