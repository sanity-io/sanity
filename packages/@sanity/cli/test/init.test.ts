import fs from 'node:fs/promises'
import path from 'node:path'

import {describe, expect} from 'vitest'

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

  testConcurrent('adds autoUpdates: true to cli config for javascript projects', async () => {
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

  testConcurrent('adds autoUpdates: false to cli config if flag provided', async () => {
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
      '--no-auto-updates',
    ])

    const cliConfig = await fs.readFile(path.join(baseTestPath, outpath, 'sanity.cli.ts'), 'utf-8')

    expect(cliConfig).toContain(`projectId: '${cliProjectId}'`)
    expect(cliConfig).toContain(`dataset: '${testRunArgs.dataset}'`)
    expect(cliConfig).toContain(`autoUpdates: false`)
  })

  describe('remote templates', () => {
    testConcurrent('initializes a project from a GitHub repository shorthand', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-remote-template-shorthand'

      await runSanityCmdCommand(version, [
        'init',
        '--y',
        '--project',
        cliProjectId,
        '--dataset',
        testRunArgs.dataset,
        '--template',
        'sanity-io/sanity/packages/@sanity/cli/test/test-template',
        '--output-path',
        `${baseTestPath}/${outpath}`,
        '--package-manager',
        'manual',
      ])

      // Check if essential files exist
      const hasPackageJson = await fs
        .access(path.join(baseTestPath, outpath, 'package.json'))
        .then(() => true)
        .catch(() => false)
      const hasSanityConfig = await fs
        .access(path.join(baseTestPath, outpath, 'sanity.config.ts'))
        .then(() => true)
        .catch(() => false)
      const hasEnvFile = await fs
        .access(path.join(baseTestPath, outpath, '.env.local'))
        .then(() => true)
        .catch(() => false)

      expect(hasPackageJson).toBe(true)
      expect(hasSanityConfig).toBe(true)
      expect(hasEnvFile).toBe(true)
    })

    testConcurrent('initializes a project from a GitHub URL', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-remote-template-url'

      await runSanityCmdCommand(version, [
        'init',
        '--y',
        '--project',
        cliProjectId,
        '--dataset',
        testRunArgs.dataset,
        '--template',
        'https://github.com/sanity-io/sanity/tree/next/packages/@sanity/cli/test/test-template',
        '--output-path',
        `${baseTestPath}/${outpath}`,
        '--package-manager',
        'manual',
      ])

      const hasPackageJson = await fs
        .access(path.join(baseTestPath, outpath, 'package.json'))
        .then(() => true)
        .catch(() => false)
      const hasSanityConfig = await fs
        .access(path.join(baseTestPath, outpath, 'sanity.config.ts'))
        .then(() => true)
        .catch(() => false)
      const hasEnvFile = await fs
        .access(path.join(baseTestPath, outpath, '.env.local'))
        .then(() => true)
        .catch(() => false)

      expect(hasPackageJson).toBe(true)
      expect(hasSanityConfig).toBe(true)
      expect(hasEnvFile).toBe(true)
    })

    testConcurrent('correctly applies environment variables', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-remote-template-env'

      await runSanityCmdCommand(version, [
        'init',
        '--y',
        '--project',
        cliProjectId,
        '--dataset',
        testRunArgs.dataset,
        '--template',
        'sanity-io/sanity/packages/@sanity/cli/test/test-template',
        '--output-path',
        `${baseTestPath}/${outpath}`,
        '--package-manager',
        'manual',
      ])

      const envContent = await fs.readFile(path.join(baseTestPath, outpath, '.env.local'), 'utf-8')

      expect(envContent).toContain(`SANITY_PROJECT_ID=${cliProjectId}`)
      expect(envContent).toContain(`SANITY_DATASET=${testRunArgs.dataset}`)
    })

    testConcurrent('fails with invalid repository format', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-remote-template-invalid'

      await expect(
        runSanityCmdCommand(version, [
          'init',
          '--y',
          '--project',
          cliProjectId,
          '--dataset',
          testRunArgs.dataset,
          '--template',
          'invalid-repo-format',
          '--output-path',
          `${baseTestPath}/${outpath}`,
          '--package-manager',
          'manual',
        ]),
      ).rejects.toThrow()
    })

    testConcurrent('fails with non-existent repository', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-remote-template-nonexistent'

      await expect(
        runSanityCmdCommand(version, [
          'init',
          '--y',
          '--project',
          cliProjectId,
          '--dataset',
          testRunArgs.dataset,
          '--template',
          'sanity-io/non-existent-template',
          '--output-path',
          `${baseTestPath}/${outpath}`,
          '--package-manager',
          'manual',
        ]),
      ).rejects.toThrow(
        'GitHub repository not found. For private repositories, use --template-token to provide an access token',
      )
    })
  })
})
