import path from 'path'
import {describeCliTest} from './shared/describe'
import {testStartCommand} from './shared/devServer'
import {getTestRunArgs, studiosPath, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity start`', () => {
  describe.each(studioVersions)('%s', (version) => {
    test('start', async () => {
      const testRunArgs = getTestRunArgs(version)
      const startHtml = await testStartCommand({
        port: testRunArgs.port,
        cwd: path.join(studiosPath, version),
        expectedTitle: version === 'v2' ? `${version} studio` : 'Sanity Studio',
      })
      expect(startHtml).toContain(version === 'v2' ? 'id="sanityBody"' : 'id="sanity"')
    })
  })
})
