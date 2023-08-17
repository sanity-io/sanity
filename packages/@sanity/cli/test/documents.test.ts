import {describeCliTest, testConcurrent} from './shared/describe'
import {runSanityCmdCommand, studioVersions, testClient, getTestRunArgs} from './shared/environment'

describeCliTest('CLI: `sanity documents`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const testRunArgs = getTestRunArgs(version)
    const client = testClient.withConfig({
      dataset: testRunArgs.documentsDataset,
    })

    testConcurrent('documents create', async () => {
      const result = await runSanityCmdCommand(version, [
        'documents',
        'create',
        'document.json',
        '--dataset',
        testRunArgs.documentsDataset,
        '--replace',
      ])
      expect(result.stdout).toMatch(/upserted/i)
      expect(result.code).toBe(0)

      const doc = await client.getDocument('drafts.magnus-carlsen')
      expect(doc?._id).toBe('drafts.magnus-carlsen')
    })

    testConcurrent('documents get', async () => {
      await client.createOrReplace(
        {
          _id: 'person_erling',
          _type: 'person',
          name: 'Erling Haaland',
        },
        {visibility: 'async'},
      )

      const result = await runSanityCmdCommand(version, [
        'documents',
        'get',
        'person_erling',
        '--dataset',
        testRunArgs.documentsDataset,
      ])
      expect(result.stdout).toContain('"Erling Haaland"')
      expect(result.code).toBe(0)
    })

    testConcurrent('documents query', async () => {
      await client.createOrReplace({
        _id: 'person_odegaard',
        _type: 'person',
        name: 'Martin Ødegaard',
      })

      const result = await runSanityCmdCommand(version, [
        'documents',
        'query',
        '*[_type == "person" && name == "Martin Ødegaard"][0]',
        '--dataset',
        testRunArgs.documentsDataset,
        '--api-version',
        '2022-09-09',
      ])
      expect(result.stdout).toContain('"Martin Ødegaard"')
      expect(result.code).toBe(0)
    })

    testConcurrent('documents delete', async () => {
      await client.createOrReplace(
        {
          _id: 'person_king',
          _type: 'person',
          name: 'Joshua King',
        },
        {visibility: 'async'},
      )

      const result = await runSanityCmdCommand(version, [
        'documents',
        'delete',
        'person_king',
        '--dataset',
        testRunArgs.documentsDataset,
      ])
      expect(result.stdout).toMatch(/deleted 1 document/i)
      expect(result.code).toBe(0)
    })
  })
})
