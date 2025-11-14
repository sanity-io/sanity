import {randomUUID} from 'node:crypto'
import {readFile, unlink, writeFile} from 'node:fs/promises'

import {beforeEach, describe, expect, test} from 'vitest'

import {describeCliTest} from './shared/describe'
import {runSanityCmdCommand, studioNames, studiosPath} from './shared/environment'

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
    if (!config) {
      await unlink(path)
      return
    }

    await writeFile(path, JSON.stringify(config))
    return
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
}

const withConfig =
  <T extends boolean>(
    {config, legacyConfig}: {config: any; legacyConfig: T},
    t: T extends true ? (path: string) => Promise<void> : () => Promise<void>,
  ) =>
  async (): Promise<void> => {
    const legacyConfigName = `legacy-config-${randomUUID()}.json`
    const path = `${studiosPath}/cli-test-studio/${legacyConfig ? legacyConfigName : 'sanity.cli.ts'}`

    await writeTypegenConfig(path, config, legacyConfig ? 'legacy' : 'cli')

    try {
      await t(legacyConfigName)
    } finally {
      await writeTypegenConfig(path, undefined, legacyConfig ? 'legacy' : 'cli')
    }
  }

describeCliTest('CLI: `sanity typegen`', () => {
  beforeEach(async () => {
    // reset the sanity.cli.ts before each test
    await writeTypegenConfig(`${studiosPath}/cli-test-studio/sanity.cli.ts`, undefined, 'cli')
  })

  describe.each(studioNames)('%s', (studioName) => {
    test('sanity typegen generate: missing schema, default path', async () => {
      const err = await runSanityCmdCommand('cli-test-studio', ['typegen', 'generate']).catch(
        (error) => error,
      )

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
        async () => {
          const err = await runSanityCmdCommand(studioName, ['typegen', 'generate']).catch(
            (error) => error,
          )
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
          config: {
            schema: 'does-not-exist.json',
          },
          legacyConfig: false,
        },
        async () => {
          const legacyConfigFile = 'conflicting-config.json'
          await writeTypegenConfig(
            `${studiosPath}/cli-test-studio/${legacyConfigFile}`,
            workingTypegen,
            'legacy',
          )

          const result = await runSanityCmdCommand(studioName, [
            'typegen',
            'generate',
            '--config-path',
            legacyConfigFile,
          ]).catch((error) => error)

          expect(result.code).toBe(0)
          expect(result.stderr).toContain(
            `You've specified typegen in your Sanity CLI config, but also have a typegen config`,
          )
          expect(result.stderr).toContain(
            'Generated TypeScript types for 2 schema types and 1 GROQ queries',
          )
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
          expect(result.stderr).toContain(
            'Generated TypeScript types for 2 schema types and 1 GROQ queries',
          )
        },
      ),
    )

    describe.each([
      ['cli config', false],
      ['legacy config', true],
    ])('%s', (title, legacyConfig) => {
      test(
        'sanity typegen generate: missing schema, custom path',
        withConfig(
          {
            config: {
              schema: './schema-that-doesnt-exist.json',
            },
            legacyConfig,
          },
          async (legacyConfigFile) => {
            const err = await runSanityCmdCommand(studioName, [
              'typegen',
              'generate',
              ...(legacyConfig ? ['--config-path', legacyConfigFile] : []),
            ]).catch((error) => error)
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
          async (legacyConfigFile) => {
            const result = await runSanityCmdCommand(studioName, [
              'typegen',
              'generate',
              ...(legacyConfig ? ['--config-path', legacyConfigFile] : []),
            ])

            expect(result.code).toBe(0)
            expect(result.stderr).toContain(
              'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
            )
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
          async (legacyConfigFile) => {
            // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
            await writeFile(
              `${studiosPath}/cli-test-studio/out/.prettierrc`,
              '{\n  "singleQuote": true\n}\n',
            )
            const result = await runSanityCmdCommand(studioName, [
              'typegen',
              'generate',
              ...(legacyConfig ? ['--config-path', legacyConfigFile] : []),
            ])

            expect(result.code).toBe(0)
            expect(result.stderr).toContain(
              'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
            )

            const types = await readFile(`${studiosPath}/cli-test-studio/out/types.ts`)
            expect(types.toString()).toContain(`'person'`)
            expect(types.toString()).toMatchSnapshot()
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
          async (legacyConfigFile) => {
            // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
            const result = await runSanityCmdCommand(studioName, [
              'typegen',
              'generate',
              ...(legacyConfig ? ['--config-path', legacyConfigFile] : []),
            ])

            expect(result.code).toBe(0)
            expect(result.stderr).toContain(
              'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
            )

            const types = await readFile(`${studiosPath}/cli-test-studio/out/types.ts`)
            expect(types.toString()).toContain(
              `'*[_type == "page" && slug.current == $slug][0]': PAGE_QUERYResult;`,
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
          async (legacyConfigFile) => {
            await writeFile(
              `${studiosPath}/cli-test-studio/out/.prettierrc`,
              '{\n  "singleQuote": true\n}\n',
            )
            const result = await runSanityCmdCommand(studioName, [
              'typegen',
              'generate',
              ...(legacyConfig ? ['--config-path', legacyConfigFile] : []),
            ])

            expect(result.code).toBe(0)
            expect(result.stderr).toContain(
              'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
            )

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
          async (legacyConfigFile) => {
            const result = await runSanityCmdCommand(studioName, [
              'typegen',
              'generate',
              ...(legacyConfig ? ['--config-path', legacyConfigFile] : []),
            ])

            const types = await readFile(
              `${studiosPath}/cli-test-studio/out/absolute-path-types.ts`,
            )
            expect(types.length).toBeGreaterThan(100)

            expect(result.code).toBe(0)
            expect(result.stderr).toContain(
              'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
            )
          },
        ),
      )
    })
  })
})
