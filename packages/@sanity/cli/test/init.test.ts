import fs from 'node:fs/promises'
import path from 'node:path'

import {describe, expect} from '@jest/globals'

import templates from '../src/actions/init-project/templates'
import {describeCliTest, testConcurrent} from './shared/describe'
import {baseTestPath, cliProjectId, getTestRunArgs, runSanityCmdCommand} from './shared/environment'

describeCliTest('CLI: `sanity init v3`', () => {
  describe.each(Object.keys(templates))('for template %s', (template) => {
    testConcurrent('adds autoUpdates: true to cli config', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = `test-template-${template}-${version}`

      await runSanityCmdCommand(version, [
        'init',
        '--y',
        '--project',
        cliProjectId,
        '--dataset',
        testRunArgs.dataset,
        '--template',
        template,
        '--output-path',
        `${baseTestPath}/${outpath}`,
        '--package-manager',
        'manual',
      ])

      const cliConfig = await fs.readFile(
        path.join(baseTestPath, outpath, 'sanity.cli.ts'),
        'utf-8',
      )

      expect(cliConfig).toContain(`projectId: '${cliProjectId}'`)
      expect(cliConfig).toContain(`dataset: '${testRunArgs.dataset}'`)
      expect(cliConfig).toContain(`autoUpdates: true`)
    })
  })

  testConcurrent('adds autoUpdate: true to cli config for javascript projects', async () => {
    const version = 'v3'
    const testRunArgs = getTestRunArgs(version)
    const outpath = `test-template-${version}`

    await runSanityCmdCommand(version, [
      'init',
      '--y',
      '--project',
      cliProjectId,
      '--dataset',
      testRunArgs.dataset,
      '--output-path',
      `${baseTestPath}/${outpath}`,
      '--package-manager',
      'manual',
      '--no-typescript',
    ])

    const cliConfig = await fs.readFile(path.join(baseTestPath, outpath, 'sanity.cli.js'), 'utf-8')

    expect(cliConfig).toContain(`projectId: '${cliProjectId}'`)
    expect(cliConfig).toContain(`dataset: '${testRunArgs.dataset}'`)
    expect(cliConfig).toContain(`autoUpdates: true`)
  })
})
