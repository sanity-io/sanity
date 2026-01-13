import {EventEmitter} from 'node:events'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {sanitySchemaExtractionPlugin} from '../plugin-schema-extraction'

vi.mock('../../_internal/cli/actions/schema/schemaExtractorApi', () => ({
  extractSchemaToFile: vi.fn().mockResolvedValue(undefined),
  SchemaExtractionError: class SchemaExtractionError extends Error {},
}))

describe('sanitySchemaExtractionPlugin', () => {
  let extractSchemaToFile: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.useFakeTimers()
    const module = await import('../../_internal/cli/actions/schema/schemaExtractorApi')
    extractSchemaToFile = vi.mocked(module.extractSchemaToFile)
    extractSchemaToFile.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('extracts schema when a matching file changes', async () => {
    const plugin = sanitySchemaExtractionPlugin({
      output: {log: vi.fn(), info: vi.fn(), error: vi.fn()},
      debounceMs: 100,
      enforceRequiredFields: true,
    })

    // Simulate Vite's configResolved hook
    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    // Create a fake watcher and server, then call configureServer hook
    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: null
    }) => void
    configureServer({watcher, httpServer: null})

    expect(extractSchemaToFile).toHaveBeenCalledTimes(0)

    // Trigger three rapid changes on a schema file
    watcher.emit('change', '/project/schemaTypes/post.ts')
    watcher.emit('change', '/project/schemaTypes/page.ts')
    watcher.emit('change', '/project/schemaTypes/author.ts')

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(100)
    expect(extractSchemaToFile).toHaveBeenCalledTimes(1)

    // Called with correct params in object
    expect(extractSchemaToFile).toHaveBeenCalledWith({
      enforceRequiredFields: true,
      workDir: '/project',
      outputPath: '/project/schema.json',
      workspaceName: undefined,
    })

    // Trigger another change
    watcher.emit('change', '/project/schemaTypes/author.ts')
    await vi.advanceTimersByTimeAsync(100)
    expect(extractSchemaToFile).toHaveBeenCalledTimes(2)

    // Trigger a change event unrelated to the watching
    watcher.emit('change', '/src/component/Foobar/index.tsx')
    await vi.advanceTimersByTimeAsync(100)
    expect(extractSchemaToFile).toHaveBeenCalledTimes(2)
  })
})
