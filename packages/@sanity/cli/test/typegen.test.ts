import {expect, test} from '@jest/globals'

import {describeCliTest} from './shared/describe'
import {runSanityCmdCommand} from './shared/environment'

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
    expect(result.stderr).toContain('Generated TypeScript types for 2 schema types')
  })
})
