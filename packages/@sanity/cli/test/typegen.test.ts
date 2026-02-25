import {randomUUID} from 'node:crypto'
import {access, readFile, rm, unlink, writeFile} from 'node:fs/promises'
import {join} from 'node:path'

import {once} from 'lodash-es'
import {describe, expect, test} from 'vitest'

import {describeCliTest} from './shared/describe'
import {
  runSanityCmdCommand,
  runSanityLongRunningCommand,
  studioNames,
  studiosPath,
} from './shared/environment'

const workingTypegen = {
  schema: './working-schema.json',
  generates: './out/types.ts',
}

/**
 * Write config file to use in the test
 *
 * @param path - Path to the file
 * @param config - Typegen config to write
 * @param legacy - Type of config to write
 */
async function writeTypegenConfig(path: string, config: any, type: 'legacy' | 'cli') {
  // write to legacy config
  if (type === 'legacy') {
    await writeFile(path, JSON.stringify(config))
    return {
      cleanup: () => unlink(path),
    }
  }

  // get the cli config template, add the typegen bits and write it
  await writeFile(
    path,
    `import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  project: {basePath: '/config-base-path'},
  graphql: [{playground: false}],
  ${config ? `typegen: ${JSON.stringify(config)},` : ''}
})
`,
  )
  return {
    cleanup: () => unlink(path),
  }
}

const withConfig =
  (
    {config, legacyConfig}: {config: any; legacyConfig: boolean},
    t: (configFileName: string) => Promise<void>,
  ) =>
  async (): Promise<void> => {
    const configFileName = legacyConfig
      ? `legacy-config-${randomUUID()}.json`
      : `sanity.cli.${randomUUID()}.ts`
    const path = `${studiosPath}/cli-test-studio/${configFileName}`

    const {cleanup} = await writeTypegenConfig(path, config, legacyConfig ? 'legacy' : 'cli')

    try {
      await t(configFileName.replace(/\.ts$/, ''))
    } finally {
      await cleanup()
    }
  }

describeCliTest('CLI: `sanity typegen`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    test('sanity typegen generate: missing schema, default path', async () => {
      const err = await runSanityCmdCommand('cli-test-studio', ['typegen', 'generate']).catch(
        (error) => error,
      )

      // assert that the schema.json is not there
      await expect(access(join(studiosPath, studioName, 'schema.json'))).rejects.toThrow()

      expect(err.code).toBe(1)
      expect(err.stderr).toContain('did you run "sanity schema extract"')
      expect(err.stderr).toContain('Schema file not found')
    })

    test(
      'sanity typegen generate: typegen config is not a file',
      withConfig(
        {
          config: {
            schema: './components',
          },
          legacyConfig: false,
        },
        async (configFileName) => {
          const err = await runSanityCmdCommand(studioName, ['typegen', 'generate'], {
            env: {
              SANITY_CLI_TEST_CONFIG_NAME: configFileName,
            },
          }).catch((error) => error)
          expect(err.code).toBe(1)
          expect(err.stderr).toContain('Schema path is not a file')
        },
      ),
    )

    test('sanity typegen generate: typegen config does not exist', async () => {
      const err = await runSanityCmdCommand(studioName, [
        'typegen',
        'generate',
        '--config-path',
        'does-not-exist.json',
      ]).catch((error) => error)
      expect(err.code).toBe(1)
      expect(err.stderr).toContain('Typegen config file not found')
    })

    test(
      'sanity typegen generate: typegen defined in both cli and legacy config',
      withConfig(
        {
          // using the sanity cli config
          config: workingTypegen,
          legacyConfig: false,
        },
        async (configFileName) => {
          // also using a legacy config
          const legacyConfigFile = `${randomUUID()}.json`
          await writeTypegenConfig(
            `${studiosPath}/cli-test-studio/${legacyConfigFile}`,
            {schema: 'does-not-exist.json'},
            'legacy',
          )

          const result = await runSanityCmdCommand(
            studioName,
            ['typegen', 'generate', '--config-path', legacyConfigFile],
            {
              env: {
                SANITY_CLI_TEST_CONFIG_NAME: configFileName,
              },
            },
          ).catch((error) => error)

          expect(result.code).toBe(0)
          expect(result.stderr).toContain(
            `You've specified typegen in your Sanity CLI config, but also have a typegen config`,
          )
          expect(result.stderr).toContain('The config from the Sanity CLI config is used')
          expect(result.stderr).toContain('Successfully generated types')
          expect(result.stderr).toContain('1 query and 2 schema types')
          expect(result.stderr).toContain('found queries in 1 file after evaluating 1 file')
        },
      ),
    )

    test(
      'sanity typegen generate: typegen with legacy config',
      withConfig(
        {
          config: workingTypegen,
          legacyConfig: true,
        },
        async (legacyConfigFile) => {
          const result = await runSanityCmdCommand(studioName, [
            'typegen',
            'generate',
            '--config-path',
            legacyConfigFile,
          ]).catch((error) => error)

          expect(result.code).toBe(0)
          expect(result.stderr).toContain('The separate typegen config has been deprecated')
          expect(result.stderr).toContain('Successfully generated types')
          expect(result.stderr).toContain('1 query and 2 schema types')
          expect(result.stderr).toContain('found queries in 1 file after evaluating 1 file')
        },
      ),
    )

    describe.each([
      ['cli config', false],
      ['legacy config', true],
    ])('%s', (title, legacyConfig) => {
      const getParams = (fileName: string) => ({
        cmdOptions: legacyConfig
          ? {}
          : {
              env: {
                SANITY_CLI_TEST_CONFIG_NAME: fileName,
              },
            },
        cmdArgs: legacyConfig ? ['--config-path', fileName] : [],
      })

      test(
        'sanity typegen generate: missing schema, custom path',
        withConfig(
          {
            config: {
              schema: './schema-that-doesnt-exist.json',
            },
            legacyConfig,
          },
          async (configFileName) => {
            const {cmdOptions, cmdArgs} = getParams(configFileName)
            const err = await runSanityCmdCommand(
              studioName,
              ['typegen', 'generate', ...cmdArgs],
              cmdOptions,
            ).catch((error) => error)
            expect(err.code).toBe(1)
            expect(err.stderr).not.toContain('did you run "sanity schema extract"')
            expect(err.stderr).toContain('schema-that-doesnt-exist.json')
          },
        ),
      )

      test(
        'sanity typegen generate: working schema',
        withConfig(
          {
            config: workingTypegen,
            legacyConfig,
          },
          async (configFileName) => {
            const {cmdOptions, cmdArgs} = getParams(configFileName)

            const result = await runSanityCmdCommand(
              studioName,
              ['typegen', 'generate', ...cmdArgs],
              cmdOptions,
            )

            expect(result.code).toBe(0)
            expect(result.stderr).toContain('Successfully generated types')
            expect(result.stderr).toContain('1 query and 2 schema types')
            expect(result.stderr).toContain('found queries in 1 file')
          },
        ),
      )

      test(
        'sanity typegen generate: watch mode',
        withConfig(
          {
            config: workingTypegen,
            legacyConfig,
          },
          async (configFileName) => {
            const {cmdOptions, cmdArgs} = getParams(configFileName)
            const filename = `${Math.random().toString(36)}.ts`
            const unrelatedFilename = `${Math.random().toString(36)}.ts`
            const watchedFile = join(studiosPath, studioName, 'src', filename)
            const unrelatedFile = join(studiosPath, studioName, unrelatedFilename)

            async function cleanup() {
              await rm(watchedFile, {force: true})
              await rm(unrelatedFile, {force: true})
            }

            const createFile = once(() => writeFile(watchedFile, ''))
            const changeFile = once(() => writeFile(watchedFile, 'apekatt'))
            const createUnwatchedFile = once(() => writeFile(unrelatedFile, ''))

            try {
              await cleanup()
              await runSanityLongRunningCommand(
                studioName,
                ['typegen', 'generate', '--watch', ...cmdArgs],
                {
                  ...cmdOptions,
                  timeout: 25_000,
                },
                async (output) => {
                  // assert that it's doing the initial generation
                  expect(output.stderr).toContain('Successfully generated types')

                  // add a ts file to the tmp studio dir
                  await createFile()
                  expect(output.stdout).toContain(`add: src/${filename}`)

                  // change the file, and something that we don't watch
                  await changeFile()
                  await createUnwatchedFile()
                  expect(output.stdout).toContain(`change: src/${filename}`)
                  expect(output.stdout).not.toContain(`src/${unrelatedFilename}`)

                  // Note: we don't test unlink events because they are unreliably emitted
                  // by chokidar on Linux CI environments (known inotify limitation)

                  // We should have two generations: initial + quick succession changes being debounced
                  expect(output.stderr.match(/Successfully generated types/g)?.length).toBe(2)
                },
              )
            } finally {
              await cleanup()
            }
          },
        ),
      )

      test(
        'sanity typegen generate: formats code',
        withConfig(
          {
            config: workingTypegen,
            legacyConfig,
          },
          async (configFileName) => {
            const {cmdOptions, cmdArgs} = getParams(configFileName)

            // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
            await writeFile(
              `${studiosPath}/cli-test-studio/out/.prettierrc`,
              '{\n  "singleQuote": true\n}\n',
            )
            const result = await runSanityCmdCommand(
              studioName,
              ['typegen', 'generate', ...cmdArgs],
              cmdOptions,
            )

            expect(result.code).toBe(0)
            expect(result.stderr).toContain('Successfully generated types')
            expect(result.stderr).toContain('1 query and 2 schema types')
            expect(result.stderr).toContain('found queries in 1 file')
            expect(result.stderr).toContain('formatted the generated code with prettier')
          },
        ),
      )

      test(
        'sanity typegen generate: generates query type map',
        withConfig(
          {
            config: workingTypegen,
            legacyConfig,
          },
          async (configFileName) => {
            const {cmdOptions, cmdArgs} = getParams(configFileName)

            // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
            const result = await runSanityCmdCommand(
              studioName,
              ['typegen', 'generate', ...cmdArgs],
              cmdOptions,
            )

            expect(result.code).toBe(0)
            expect(result.stderr).toContain('Successfully generated types')
            expect(result.stderr).toContain('1 query and 2 schema types')
            expect(result.stderr).toContain('found queries in 1 file')

            const types = await readFile(`${studiosPath}/cli-test-studio/out/types.ts`)
            expect(types.toString()).toContain(
              `'*[_type == "page" && slug.current == $slug][0]': PAGE_QUERY_RESULT;`,
            )
          },
        ),
      )

      test(
        'sanity typegen generate: with overloadClientMethods false',
        withConfig(
          {
            config: {
              schema: './working-schema.json',
              generates: './out/types.ts',
              overloadClientMethods: false,
            },
            legacyConfig,
          },
          async (configFileName) => {
            const {cmdOptions, cmdArgs} = getParams(configFileName)

            await writeFile(
              `${studiosPath}/cli-test-studio/out/.prettierrc`,
              '{\n  "singleQuote": true\n}\n',
            )
            const result = await runSanityCmdCommand(
              studioName,
              ['typegen', 'generate', ...cmdArgs],
              cmdOptions,
            )

            expect(result.code).toBe(0)
            expect(result.stderr).toContain('Successfully generated types')
            expect(result.stderr).toContain('1 query and 2 schema types')
            expect(result.stderr).toContain('found queries in 1 file')

            const types = await readFile(`${studiosPath}/cli-test-studio/out/types.ts`)
            expect(types.toString()).not.toContain(`Query TypeMap`)
            expect(types.toString()).toMatchSnapshot()
          },
        ),
      )

      test(
        'sanity typegen generate: with absolute output path',
        withConfig(
          {
            config: {
              ...workingTypegen,
              generates: `${studiosPath}/cli-test-studio/out/absolute-path-types.ts`,
            },
            legacyConfig,
          },
          async (configFileName) => {
            const {cmdOptions, cmdArgs} = getParams(configFileName)

            const result = await runSanityCmdCommand(
              studioName,
              ['typegen', 'generate', ...cmdArgs],
              cmdOptions,
            )

            const types = await readFile(
              `${studiosPath}/cli-test-studio/out/absolute-path-types.ts`,
            )
            expect(types.length).toBeGreaterThan(100)

            expect(result.code).toBe(0)
            expect(result.stderr).toContain('Successfully generated types')
            expect(result.stderr).toContain('1 query and 2 schema types')
            expect(result.stderr).toContain('found queries in 1 file')

            expect(types.toString()).toMatchSnapshot()
          },
        ),
      )
    })
  })
})
