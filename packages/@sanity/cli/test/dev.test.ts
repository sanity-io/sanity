import path from 'path'
import {describeCliTest} from './shared/describe'
import {testServerCommand} from './shared/devServer'
import {getTestRunArgs, studiosPath, studioVersions} from './shared/environment'

describeCliTest('CLI: `sanity dev`', () => {
  describe.each(studioVersions)('%s', (version) => {
    test('start', async () => {
      const testRunArgs = getTestRunArgs(version)
      const startHtml = await testServerCommand({
        command: version === 'v2' ? 'start' : 'dev',
        port: testRunArgs.port,
        cwd: path.join(studiosPath, version),
        expectedTitle: version === 'v2' ? `${version} studio` : 'Sanity Studio',
      })
      expect(startHtml).toContain(version === 'v2' ? 'id="sanityBody"' : 'id="sanity"')
    })
  })
})
