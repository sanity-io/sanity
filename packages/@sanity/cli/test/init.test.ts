import fs from 'node:fs/promises'
import path from 'node:path'

import {describe, expect} from 'vitest'

import {determineAppTemplate} from '../src/actions/init-project/determineAppTemplate'
import templates from '../src/actions/init-project/templates'
import {describeCliTest, testConcurrent} from './shared/describe'
import {baseTestPath, cliProjectId, getTestRunArgs, runSanityCmdCommand} from './shared/environment'

async function cleanOutputDirectory(outpath: string): Promise<void> {
  const fullPath = path.join(baseTestPath, outpath)
  try {
    await fs.rm(fullPath, {recursive: true, force: true})
  } catch {
    // Directory might not exist, which is fine
  }
}

describeCliTest('CLI: `sanity init v3`', () => {
  // filter out non-studio apps for now, until we add things they can auto-update
  describe.each(Object.keys(templates).filter((template) => !determineAppTemplate(template)))(
    'for template %s',
    (template) => {
      testConcurrent('adds autoUpdates: true to cli config', async () => {
        const version = 'v3'
        const testRunArgs = getTestRunArgs(version)
        const outpath = `test-template-${template}-${version}`

        await cleanOutputDirectory(outpath)

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
        expect(cliConfig).toContain('dataset:')
        expect(cliConfig).toContain(`autoUpdates: true`)
      })
    },
  )

  testConcurrent('adds autoUpdates: true to cli config for javascript projects', async () => {
    const version = 'v3'
    const testRunArgs = getTestRunArgs(version)
    const outpath = `test-template-${version}`

    await cleanOutputDirectory(outpath)

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
    expect(cliConfig).toContain('dataset:')
    expect(cliConfig).toContain(`autoUpdates: true`)
  })

  testConcurrent('adds autoUpdates: false to cli config if flag provided', async () => {
    const version = 'v3'
    const testRunArgs = getTestRunArgs(version)
    const outpath = `test-template-${version}`

    await cleanOutputDirectory(outpath)

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
    expect(cliConfig).toContain('dataset:')
    expect(cliConfig).toContain(`autoUpdates: false`)
  })

  describe('unattended mode with flags', () => {
    testConcurrent('respects --typescript flag in unattended mode', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-unattended-typescript'

      await cleanOutputDirectory(outpath)

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
        '--typescript',
      ])

      const cliConfig = await fs.readFile(
        path.join(baseTestPath, outpath, 'sanity.cli.ts'),
        'utf-8',
      )
      expect(cliConfig).toContain(`projectId: '${cliProjectId}'`)
      expect(cliConfig).toContain('dataset:')
    })

    testConcurrent('respects --no-typescript flag in unattended mode', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-unattended-no-typescript'

      await cleanOutputDirectory(outpath)

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

      const cliConfig = await fs.readFile(
        path.join(baseTestPath, outpath, 'sanity.cli.js'),
        'utf-8',
      )
      expect(cliConfig).toContain(`projectId: '${cliProjectId}'`)
      expect(cliConfig).toContain('dataset:')
    })

    testConcurrent('--overwrite-files overwrites existing files', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-overwrite-yes'

      await cleanOutputDirectory(outpath)

      // Create a custom sanity.cli.ts file that will collide
      const configPath = path.join(baseTestPath, outpath, 'sanity.cli.ts')
      await fs.mkdir(path.join(baseTestPath, outpath), {recursive: true})
      await fs.writeFile(configPath, '// Custom config content')

      // Initialize with overwrite flag
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
        '--overwrite-files',
      ])

      // File should be overwritten with proper Sanity config
      const configContent = await fs.readFile(configPath, 'utf-8')
      expect(configContent).not.toContain('// Custom config content')
      expect(configContent).toContain(`projectId: '${cliProjectId}'`)
      expect(configContent).toContain('dataset:')
    })

    testConcurrent('without --overwrite-files, existing files are preserved', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-overwrite-no'

      await cleanOutputDirectory(outpath)

      // Create a custom sanity.cli.ts file that will collide
      const configPath = path.join(baseTestPath, outpath, 'sanity.cli.ts')
      await fs.mkdir(path.join(baseTestPath, outpath), {recursive: true})
      await fs.writeFile(configPath, '// Custom config content')

      // Initialize without overwrite flag
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
      ])

      // File should be preserved (not overwritten)
      const configContent = await fs.readFile(configPath, 'utf-8')
      expect(configContent).toContain('// Custom config content')
      expect(configContent).not.toContain(`projectId: '${cliProjectId}'`)
    })

    testConcurrent('respects --package-manager flag in unattended mode', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-package-manager'

      await cleanOutputDirectory(outpath)

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
        'pnpm',
      ])

      // Verify Next.js config files were created in the Next.js root (confirms the command completed successfully)
      const hasPnpmLock = await fs
        .access(path.join(baseTestPath, outpath, 'pnpm-lock.yaml'))
        .then(() => true)
        .catch(() => false)
      expect(hasPnpmLock).toBe(true)
    })

    testConcurrent(
      '--nextjs-append-env puts env file in Next.js app root, not output-path',
      async () => {
        const version = 'v3'
        const testRunArgs = getTestRunArgs(version)
        const nextjsRoot = path.join(baseTestPath, 'nextjs-app')

        await cleanOutputDirectory('nextjs-app')

        // Create a Next.js project first to trigger framework detection
        await fs.mkdir(nextjsRoot, {recursive: true})
        await fs.writeFile(
          path.join(nextjsRoot, 'package.json'),
          JSON.stringify({
            name: 'test-nextjs',
            dependencies: {next: '^15.0.0'},
          }),
        )

        // Change to the Next.js directory and run init with a different output path
        await runSanityCmdCommand(
          version,
          [
            'init',
            '--y',
            '--project',
            cliProjectId,
            '--dataset',
            testRunArgs.dataset,
            '--output-path',
            `studio`,
            '--package-manager',
            'manual',
            '--nextjs-add-config-files',
            '--no-nextjs-embed-studio',
            '--nextjs-append-env',
          ],
          {cwd: () => nextjsRoot},
        )

        // Env file should be in the Next.js app root, not the studio output path
        const hasEnvInNextjsRoot = await fs
          .access(path.join(nextjsRoot, '.env.local'))
          .then(() => true)
          .catch(() => false)
        const hasEnvInStudioOutput = await fs
          .access(path.join(nextjsRoot, 'studio', '.env.local'))
          .then(() => true)
          .catch(() => false)

        expect(hasEnvInNextjsRoot).toBe(true)
        expect(hasEnvInStudioOutput).toBe(false)

        // Verify the env file contains the correct variables
        const envContent = await fs.readFile(path.join(nextjsRoot, '.env.local'), 'utf-8')
        expect(envContent).toContain(`NEXT_PUBLIC_SANITY_PROJECT_ID="${cliProjectId}"`)
        expect(envContent).toContain('NEXT_PUBLIC_SANITY_DATASET=')
      },
    )
  })

  describe('Next.js specific flags', () => {
    testConcurrent('respects --no-nextjs-add-config-files flag', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-nextjs-no-config'

      await cleanOutputDirectory(outpath)

      // Create a Next.js project first to trigger framework detection
      await fs.mkdir(path.join(baseTestPath, outpath), {recursive: true})
      await fs.writeFile(
        path.join(baseTestPath, outpath, 'package.json'),
        JSON.stringify({
          name: 'test-nextjs',
          dependencies: {next: '^15.0.0'},
        }),
      )

      await runSanityCmdCommand(
        version,
        [
          'init',
          '--y',
          '--project',
          cliProjectId,
          '--dataset',
          testRunArgs.dataset,
          '--output-path',
          `studio`,
          '--package-manager',
          'manual',
          '--no-nextjs-add-config-files',
        ],
        {
          cwd: () => path.join(baseTestPath, outpath),
        },
      )

      // Should not create sanity folder or config files since flag was disabled
      const hasSanityFolder = await fs
        .access(path.join(baseTestPath, outpath, 'sanity'))
        .then(() => true)
        .catch(() => false)
      const hasSanityConfig = await fs
        .access(path.join(baseTestPath, outpath, 'sanity.cli.ts'))
        .then(() => true)
        .catch(() => false)

      expect(hasSanityFolder).toBe(false)
      expect(hasSanityConfig).toBe(false)
    })

    testConcurrent(
      'creates sanity folder when config files enabled but studio not embedded',
      async () => {
        const version = 'v3'
        const testRunArgs = getTestRunArgs(version)
        const outpath = 'test-nextjs-sanity-folder'

        await cleanOutputDirectory(outpath)

        // Create a Next.js project first to trigger framework detection
        await fs.mkdir(path.join(baseTestPath, outpath), {recursive: true})
        await fs.writeFile(
          path.join(baseTestPath, outpath, 'package.json'),
          JSON.stringify({
            name: 'test-nextjs',
            dependencies: {next: '^15.0.0'},
          }),
        )

        await runSanityCmdCommand(
          version,
          [
            'init',
            '--y',
            '--project',
            cliProjectId,
            '--dataset',
            testRunArgs.dataset,
            '--output-path',
            `${baseTestPath}/${outpath}/studio`,
            '--package-manager',
            'manual',
            '--nextjs-add-config-files',
            '--no-nextjs-embed-studio',
          ],
          {
            cwd: () => path.join(baseTestPath, outpath),
          },
        )

        // Should create sanity folder with config files since studio is not embedded
        const hasSanityFolder = await fs
          .access(path.join(baseTestPath, outpath, 'sanity'))
          .then(() => true)
          .catch(() => false)
        // Should not create src/app/studio since studio is not embedded
        const hasStudioFolder = await fs
          .access(path.join(baseTestPath, outpath, 'src', 'app', 'studio'))
          .then(() => true)
          .catch(() => false)

        expect(hasSanityFolder).toBe(true)
        expect(hasStudioFolder).toBe(false)
      },
    )

    testConcurrent(
      'creates sanity folder in src when both config files and embed studio enabled',
      async () => {
        const version = 'v3'
        const testRunArgs = getTestRunArgs(version)
        const outpath = 'test-nextjs-src-sanity'

        await cleanOutputDirectory(outpath)

        const cwd = path.join(baseTestPath, outpath)

        // Create a Next.js project with src/ folder to trigger framework detection
        await fs.mkdir(cwd, {recursive: true})
        await fs.mkdir(path.join(cwd, 'src'), {recursive: true})
        await fs.writeFile(
          path.join(cwd, 'package.json'),
          JSON.stringify({
            name: 'test-nextjs',
            dependencies: {next: '^15.0.0'},
          }),
        )

        await runSanityCmdCommand(
          version,
          [
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
            '--nextjs-add-config-files',
            '--nextjs-embed-studio',
          ],
          {
            cwd: () => cwd,
          },
        )

        // When both config files and embed studio are enabled (with src/ folder existing):
        // - sanity folder goes in src/sanity (because src/ folder exists)
        // - src/app/studio folder is created for embedded studio
        const hasRootSanityFolder = await fs
          .access(path.join(baseTestPath, outpath, 'sanity'))
          .then(() => true)
          .catch(() => false)
        const hasSrcSanityFolder = await fs
          .access(path.join(baseTestPath, outpath, 'src', 'sanity'))
          .then(() => true)
          .catch(() => false)
        const hasStudioFolder = await fs
          .access(path.join(baseTestPath, outpath, 'src', 'app', 'studio'))
          .then(() => true)
          .catch(() => false)

        expect(hasRootSanityFolder).toBe(false)
        expect(hasSrcSanityFolder).toBe(true)
        expect(hasStudioFolder).toBe(true)
      },
    )

    testConcurrent('respects --no-nextjs-embed-studio flag', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-nextjs-no-embed'

      await cleanOutputDirectory(outpath)

      // Create a Next.js project first to trigger framework detection
      await fs.mkdir(path.join(baseTestPath, outpath), {recursive: true})
      await fs.writeFile(
        path.join(baseTestPath, outpath, 'package.json'),
        JSON.stringify({
          name: 'test-nextjs',
          dependencies: {next: '^15.0.0'},
        }),
      )

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
        '--no-nextjs-embed-studio',
      ])

      // Check that src/app/studio folder is not created
      const hasStudioFolder = await fs
        .access(path.join(baseTestPath, outpath, 'src', 'app', 'studio'))
        .then(() => true)
        .catch(() => false)

      expect(hasStudioFolder).toBe(false)
    })

    testConcurrent('respects --no-nextjs-append-env flag', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-nextjs-no-env'

      await cleanOutputDirectory(outpath)

      // Create a Next.js project first to trigger framework detection
      await fs.mkdir(path.join(baseTestPath, outpath), {recursive: true})
      await fs.writeFile(
        path.join(baseTestPath, outpath, 'package.json'),
        JSON.stringify({
          name: 'test-nextjs',
          dependencies: {next: '^15.0.0'},
        }),
      )

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
        '--no-nextjs-append-env',
      ])

      // Check that env variables are not appended
      const envContent = await fs
        .readFile(path.join(baseTestPath, outpath, '.env.local'), 'utf-8')
        .catch(() => '')

      // Should not contain Sanity env vars since flag was disabled
      expect(envContent).not.toContain('NEXT_PUBLIC_SANITY_PROJECT_ID')
      expect(envContent).not.toContain('NEXT_PUBLIC_SANITY_DATASET')
    })

    testConcurrent('combines Next.js flags correctly', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-nextjs-combined-flags'

      await cleanOutputDirectory(outpath)

      const cwd = path.join(baseTestPath, outpath)

      // Create a Next.js project first to trigger framework detection
      await fs.mkdir(cwd, {recursive: true})
      await fs.writeFile(
        path.join(cwd, 'package.json'),
        JSON.stringify({
          name: 'test-nextjs',
          dependencies: {next: '^15.0.0'},
        }),
      )

      await runSanityCmdCommand(
        version,
        [
          'init',
          '--y',
          '--project',
          cliProjectId,
          '--dataset',
          testRunArgs.dataset,
          '--output-path',
          `studio`,
          '--package-manager',
          'manual',
          '--nextjs-add-config-files',
          '--nextjs-embed-studio',
          '--nextjs-append-env',
          '--typescript',
        ],
        {
          cwd: () => cwd,
        },
      )

      // Check that all expected files and folders are created
      const hasSanityConfig = await fs
        .access(path.join(baseTestPath, outpath, 'sanity.cli.ts'))
        .then(() => true)
        .catch(() => false)
      // Check that src/app/studio folder is created when embedding studio
      const hasStudioFolder = await fs
        .access(path.join(baseTestPath, outpath, 'src', 'app', 'studio'))
        .then(() => true)
        .catch(() => false)
      // When both config files and embed studio are enabled, sanity folder goes in src/
      const hasSanityFolder = await fs
        .access(path.join(baseTestPath, outpath, 'src', 'sanity'))
        .then(() => true)
        .catch(() => false)
      const hasEnvFile = await fs
        .access(path.join(baseTestPath, outpath, '.env.local'))
        .then(() => true)
        .catch(() => false)

      expect(hasSanityConfig).toBe(true)
      expect(hasStudioFolder).toBe(true)
      expect(hasSanityFolder).toBe(true)
      expect(hasEnvFile).toBe(true)

      if (hasEnvFile) {
        const envContent = await fs.readFile(
          path.join(baseTestPath, outpath, '.env.local'),
          'utf-8',
        )
        expect(envContent).toContain(`NEXT_PUBLIC_SANITY_PROJECT_ID="${cliProjectId}"`)
        expect(envContent).toContain('NEXT_PUBLIC_SANITY_DATASET=')
      }
    })

    testConcurrent('--overwrite-files works with Next.js config files', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-nextjs-overwrite'

      await cleanOutputDirectory(outpath)

      const cwd = path.join(baseTestPath, outpath)

      // Create a Next.js project first to trigger framework detection
      await fs.mkdir(cwd, {recursive: true})
      await fs.writeFile(
        path.join(cwd, 'package.json'),
        JSON.stringify({
          name: 'test-nextjs',
          dependencies: {next: '^15.0.0'},
        }),
      )

      // Create a custom sanity.cli.ts file in the Next.js root that will collide
      // Note: --no-nextjs-embed-studio makes --output-path void, so files go to Next.js root
      const configPath = path.join(cwd, 'sanity.cli.ts')
      await fs.writeFile(configPath, '// Custom Next.js config content')

      // Initialize with overwrite flag and config files enabled
      await runSanityCmdCommand(
        version,
        [
          'init',
          '--y',
          '--project',
          cliProjectId,
          '--dataset',
          testRunArgs.dataset,
          '--output-path',
          `studio`,
          '--package-manager',
          'manual',
          '--nextjs-add-config-files',
          '--no-nextjs-embed-studio',
          '--typescript',
          '--overwrite-files',
        ],
        {
          cwd: () => cwd,
        },
      )

      // File should be overwritten with proper Sanity config
      const configContent = await fs.readFile(configPath, 'utf-8')
      expect(configContent).not.toContain('// Custom Next.js config content')
      expect(configContent).toContain('projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID')
      expect(configContent).toContain('dataset = process.env.NEXT_PUBLIC_SANITY_DATASET')
    })
  })

  describe('remote templates', () => {
    testConcurrent('initializes a project from a GitHub repository shorthand', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-remote-template-shorthand'

      await cleanOutputDirectory(outpath)

      await runSanityCmdCommand(version, [
        'init',
        '--y',
        '--project',
        cliProjectId,
        '--dataset',
        testRunArgs.dataset,
        '--template',
        'sanity-io/sanity/packages/@sanity/cli/test/__fixtures__/remote-template',
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

      await cleanOutputDirectory(outpath)

      await runSanityCmdCommand(version, [
        'init',
        '--y',
        '--project',
        cliProjectId,
        '--dataset',
        testRunArgs.dataset,
        '--template',
        'https://github.com/sanity-io/sanity/tree/main/packages/@sanity/cli/test/__fixtures__/remote-template',
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

      await cleanOutputDirectory(outpath)

      await runSanityCmdCommand(version, [
        'init',
        '--y',
        '--project',
        cliProjectId,
        '--dataset',
        testRunArgs.dataset,
        '--template',
        'sanity-io/sanity/packages/@sanity/cli/test/__fixtures__/remote-template',
        '--output-path',
        `${baseTestPath}/${outpath}`,
        '--package-manager',
        'manual',
      ])

      const envContent = await fs.readFile(path.join(baseTestPath, outpath, '.env.local'), 'utf-8')

      expect(envContent).toContain(`NEXT_PUBLIC_SANITY_PROJECT_ID=${cliProjectId}`)
      expect(envContent).toContain(`SANITY_STUDIO_PROJECT_ID=${cliProjectId}`)
      expect(envContent).toContain('NEXT_PUBLIC_SANITY_DATASET=')
      expect(envContent).toContain('SANITY_STUDIO_DATASET=')
    })

    testConcurrent('fails with invalid repository format', async () => {
      const version = 'v3'
      const testRunArgs = getTestRunArgs(version)
      const outpath = 'test-remote-template-invalid'

      await cleanOutputDirectory(outpath)

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

      await cleanOutputDirectory(outpath)

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
