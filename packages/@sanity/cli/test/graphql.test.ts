import {request} from './shared/request'
import {describeCliTest, testConcurrent} from './shared/describe'
import {getTestRunArgs, runSanityCmdCommand, studioVersions, testClient} from './shared/environment'

describeCliTest('CLI: `sanity graphql`', () => {
  describeCliTest.each(studioVersions)('%s', (version) => {
    const testRunArgs = getTestRunArgs(version)
    const graphqlDataset = testRunArgs.graphqlDataset
    const deployFlags = ['--force', '--dataset', graphqlDataset].concat(
      version === 'v2' ? ['--no-playground'] : [],
    )
    const client = testClient.withConfig({dataset: graphqlDataset})

    testConcurrent('graphql deploy', async () => {
      await client.createOrReplace(
        {
          _id: 'person_james-cameron',
          _type: 'person',
          name: 'James Cameron',
        },
        {visibility: 'async'},
      )

      const result = await runSanityCmdCommand(version, ['graphql', 'deploy', ...deployFlags])
      expect(result.stdout).toContain('https://')
      expect(result.code).toBe(0)

      const [graphqlUrl] = result.stdout.match(/(https:\/\/.*(\s|$))/) || ['']
      expect(graphqlUrl.startsWith('https://')).toBeTruthy()

      const response = await request(graphqlUrl, {
        method: 'POST',
        body: JSON.stringify({query: '{allPerson {_id, name}}'}),
        headers: {'content-type': 'application/json', accept: 'application/json'},
      }).then(
        (res) =>
          JSON.parse(res.body.toString('utf8')) as Promise<{
            data: {allPerson: {_id: string; name?: string}[]}
          }>,
      )

      expect(response).toHaveProperty('data.allPerson')
      expect(response.data.allPerson.length).toBeGreaterThanOrEqual(1)

      const cameron = response.data.allPerson.find(
        (person) => person._id === 'person_james-cameron',
      )

      expect(cameron).toBeDefined()
      expect(cameron).toHaveProperty('name')
      expect(cameron?.name).toBe('James Cameron')
    })

    testConcurrent('graphql list', async () => {
      // Need something to list first
      let result = await runSanityCmdCommand(version, [
        'graphql',
        'deploy',
        '--tag',
        'for_list',
        ...deployFlags,
      ])
      expect(result.code).toBe(0)

      result = await runSanityCmdCommand(version, ['graphql', 'list'])
      expect(result.code).toBe(0)
      expect(result.stdout).toContain(graphqlDataset)
      expect(result.stdout).toContain('for_list')
    })

    testConcurrent('graphql undeploy', async () => {
      // Need something to undeploy first
      let result = await runSanityCmdCommand(version, [
        'graphql',
        'deploy',
        '--tag',
        'for_undeploy',
        ...deployFlags,
      ])
      expect(result.code).toBe(0)

      result = await runSanityCmdCommand(version, [
        'graphql',
        'undeploy',
        '--tag',
        'for_undeploy',
        '--dataset',
        graphqlDataset,
        '--force',
      ])
      expect(result.code).toBe(0)
      expect(result.stdout).toMatch(/GraphQL API deleted/i)
    })
  })
})
