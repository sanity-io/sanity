import {readFile, writeFile} from 'node:fs/promises'

import {describe, expect, test} from 'vitest'

import {describeCliTest} from './shared/describe'
import {runSanityCmdCommand, studioNames, studiosPath} from './shared/environment'

describeCliTest('CLI: `sanity typegen`', () => {
  describe.each(studioNames)('%s', (studioName) => {
    test('sanity typegen generate: missing schema, default path', async () => {
      const err = await runSanityCmdCommand('cli-test-studio', ['typegen', 'generate']).catch(
        (error) => error,
      )
      expect(err.code).toBe(1)
      expect(err.stderr).toContain('did you run "sanity schema extract"')
      expect(err.stderr).toContain('Schema file not found')
    })

    test('sanity typegen generate: missing schema, custom path', async () => {
      const err = await runSanityCmdCommand(studioName, [
        'typegen',
        'generate',
        '--config-path',
        'missing-typegen.json',
      ]).catch((error) => error)
      expect(err.code).toBe(1)
      expect(err.stderr).not.toContain('did you run "sanity schema extract"')
      expect(err.stderr).toContain('custom-schema.json')
    })

    test('sanity typegen generate: typegen config is not a file', async () => {
      const err = await runSanityCmdCommand(studioName, [
        'typegen',
        'generate',
        '--config-path',
        'folder-typegen.json',
      ]).catch((error) => error)
      expect(err.code).toBe(1)
      expect(err.stderr).toContain('Schema path is not a file')
    })

    test('sanity typegen generate: working schema', async () => {
      const result = await runSanityCmdCommand(studioName, [
        'typegen',
        'generate',
        '--config-path',
        'working-typegen.json',
      ])

      expect(result.code).toBe(0)
      expect(result.stderr).toContain('Generated 2 schema types')
      expect(result.stderr).toContain('Generated 1 query type from 1 file out of 1 scanned file')
      expect(result.stderr).toContain('Successfully generated types')
    })

    test('sanity typegen generate: formats code', async () => {
      // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
      await writeFile(
        `${studiosPath}/cli-test-studio/out/.prettierrc`,
        '{\n  "singleQuote": true\n}\n',
      )
      const result = await runSanityCmdCommand(studioName, [
        'typegen',
        'generate',
        '--config-path',
        'working-typegen.json',
      ])

      expect(result.code).toBe(0)
      expect(result.stderr).toContain('Generated 2 schema types')
      expect(result.stderr).toContain('Generated 1 query type from 1 file out of 1 scanned file')
      expect(result.stderr).toContain('Successfully generated types')
      expect(result.stderr).toContain('Formatted generated types with prettier')

      const types = await readFile(`${studiosPath}/cli-test-studio/out/types.ts`)
      expect(types.toString()).toContain(`'person'`)
      expect(types.toString()).toMatchSnapshot()
    })

    test('sanity typegen generate: generates query type map', async () => {
      // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
      const result = await runSanityCmdCommand(studioName, [
        'typegen',
        'generate',
        '--config-path',
        'working-typegen.json',
      ])

      expect(result.code).toBe(0)
      expect(result.stderr).toContain('Generated 2 schema types')
      expect(result.stderr).toContain('Generated 1 query type from 1 file out of 1 scanned file')
      expect(result.stderr).toContain('Successfully generated types')

      const types = await readFile(`${studiosPath}/cli-test-studio/out/types.ts`)
      expect(types.toString()).toContain(
        `'*[_type == "page" && slug.current == $slug][0]': PAGE_QUERYResult;`,
      )
    })

    test('sanity typegen generate: with overloadClientMethods false', async () => {
      await writeFile(
        `${studiosPath}/cli-test-studio/out/.prettierrc`,
        '{\n  "singleQuote": true\n}\n',
      )
      const result = await runSanityCmdCommand(studioName, [
        'typegen',
        'generate',
        '--config-path',
        'working-typegen-overloadClientMethods.json',
      ])

      expect(result.code).toBe(0)
      expect(result.stderr).toContain('Generated 2 schema types')
      expect(result.stderr).toContain('Generated 1 query type from 1 file out of 1 scanned file')
      expect(result.stderr).toContain('Successfully generated types')

      const types = await readFile(`${studiosPath}/cli-test-studio/out/types.ts`)
      expect(types.toString()).not.toContain(`Query TypeMap`)
      expect(types.toString()).toMatchSnapshot()
    })
  })
})
