import {readFile, writeFile} from 'node:fs/promises'

import {expect, test} from 'vitest'

import {describeCliTest} from './shared/describe'
import {runSanityCmdCommand, studiosPath} from './shared/environment'

describeCliTest('CLI: `sanity typegen`', () => {
  test('sanity typegen generate: missing schema, default path', async () => {
    const err = await runSanityCmdCommand('v3', ['typegen', 'generate']).catch((error) => error)
    expect(err.code).toBe(1)
    expect(err.stderr).toContain('did you run "sanity schema extract"')
    expect(err.stderr).toContain('Schema file not found')
  })

  test('sanity typegen generate: missing schema, custom path', async () => {
    const err = await runSanityCmdCommand('v3', [
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
    const err = await runSanityCmdCommand('v3', [
      'typegen',
      'generate',
      '--config-path',
      'folder-typegen.json',
    ]).catch((error) => error)
    expect(err.code).toBe(1)
    expect(err.stderr).toContain('Schema path is not a file')
  })

  test('sanity typegen generate: working schema', async () => {
    const result = await runSanityCmdCommand('v3', [
      'typegen',
      'generate',
      '--config-path',
      'working-typegen.json',
    ])

    expect(result.code).toBe(0)
    expect(result.stderr).toContain(
      'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
    )
  })

  test('sanity typegen generate: formats code', async () => {
    // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
    await writeFile(`${studiosPath}/v3/out/.prettierrc`, '{\n  "singleQuote": true\n}\n')
    const result = await runSanityCmdCommand('v3', [
      'typegen',
      'generate',
      '--config-path',
      'working-typegen.json',
    ])

    expect(result.code).toBe(0)
    expect(result.stderr).toContain(
      'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
    )

    const types = await readFile(`${studiosPath}/v3/out/types.ts`)
    expect(types.toString()).toContain(`'person'`)
    expect(types.toString()).toMatchSnapshot()
  })

  test('sanity typegen generate: generates query type map', async () => {
    // Write a prettier config to the output folder, with single quotes. The defeault is double quotes.
    const result = await runSanityCmdCommand('v3', [
      'typegen',
      'generate',
      '--config-path',
      'working-typegen.json',
    ])

    expect(result.code).toBe(0)
    expect(result.stderr).toContain(
      'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
    )

    const types = await readFile(`${studiosPath}/v3/out/types.ts`)
    expect(types.toString()).toContain(
      `'*[_type == "page" && slug.current == $slug][0]': PAGE_QUERYResult;`,
    )
  })

  test('sanity typegen generate: with overloadClientMethods false', async () => {
    await writeFile(`${studiosPath}/v3/out/.prettierrc`, '{\n  "singleQuote": true\n}\n')
    const result = await runSanityCmdCommand('v3', [
      'typegen',
      'generate',
      '--config-path',
      'working-typegen-overloadClientMethods.json',
    ])

    expect(result.code).toBe(0)
    expect(result.stderr).toContain(
      'Generated TypeScript types for 2 schema types and 1 GROQ queries in 1 file',
    )

    const types = await readFile(`${studiosPath}/v3/out/types.ts`)
    expect(types.toString()).not.toContain(`Query TypeMap`)
    expect(types.toString()).toMatchSnapshot()
  })
})
