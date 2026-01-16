import {EventEmitter} from 'node:events'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {SchemaExtractionError} from '../../../actions/schema/schemaExtractorApi'
import {sanitySchemaExtractionPlugin} from '../plugin-schema-extraction'

vi.mock('../../../actions/schema/schemaExtractorApi', async (importOriginal) => ({
  ...(await importOriginal()),
  extractSchemaToFile: vi.fn().mockResolvedValue(undefined),
}))

describe('sanitySchemaExtractionPlugin', () => {
  let extractSchemaToFile: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.useFakeTimers()
    const module = await import('../../../actions/schema/schemaExtractorApi')
    extractSchemaToFile = vi.mocked(module.extractSchemaToFile)
    extractSchemaToFile.mockReset()
    extractSchemaToFile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs initial extraction when httpServer emits listening event', async () => {
    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanitySchemaExtractionPlugin({
      format: 'groq-type-nodes',
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const httpServer = new EventEmitter()

    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: typeof httpServer
    }) => void
    configureServer({watcher, httpServer})

    // No extraction yet
    expect(extractSchemaToFile).not.toHaveBeenCalled()

    // Simulate server starting
    httpServer.emit('listening')

    // Still not called - waiting for initial delay (1000ms)
    expect(extractSchemaToFile).not.toHaveBeenCalled()

    // Advance past initial extraction delay
    await vi.advanceTimersByTimeAsync(1000)

    expect(extractSchemaToFile).toHaveBeenCalledTimes(1)
    expect(output.info).toHaveBeenCalledWith(
      expect.anything(),
      'Schema extraction enabled. Watching:',
    )
  })

  it('extracts schema when a matching file changes', async () => {
    const plugin = sanitySchemaExtractionPlugin({
      format: 'groq-type-nodes',
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
      format: 'groq-type-nodes',
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

  it('logs error and validation messages when extraction fails', async () => {
    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanitySchemaExtractionPlugin({
      format: 'groq-type-nodes',
      output,
      debounceMs: 100,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: null
    }) => void
    configureServer({watcher, httpServer: null})

    // Make extraction fail with validation errors
    const validationErrors = [
      {path: ['document', 'title'], problems: [{message: 'Title is required'}]},
    ]
    extractSchemaToFile.mockRejectedValueOnce(
      new SchemaExtractionError('Schema validation failed', validationErrors as any),
    )

    // Trigger extraction
    watcher.emit('change', '/project/schemaTypes/post.ts')
    await vi.advanceTimersByTimeAsync(100)

    expect(extractSchemaToFile).toHaveBeenCalledTimes(1)
    expect(output.log).toHaveBeenCalledWith(
      expect.anything(),
      'Extraction failed: Schema validation failed',
    )
  })

  it('extracts schema during build via buildEnd hook', async () => {
    // Use real timers for this test - no debouncing involved
    vi.useRealTimers()

    // Mock returns a schema array for buildEnd to process
    extractSchemaToFile.mockResolvedValueOnce([
      {name: 'post', type: 'document'},
      {name: 'author', type: 'document'},
      {name: 'category', type: 'type'},
    ])

    const traceMock = {
      start: vi.fn(),
      log: vi.fn(),
      error: vi.fn(),
      complete: vi.fn(),
    }
    const telemetryLogger = {
      trace: vi.fn().mockReturnValue(traceMock),
    }

    const plugin = sanitySchemaExtractionPlugin({
      format: 'groq-type-nodes',
      workDir: '/project',
      outputPath: '/project/dist/schema.json',
      telemetryLogger: telemetryLogger as any,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const buildEnd = plugin.buildEnd as () => Promise<void>
    await buildEnd()

    expect(extractSchemaToFile).toHaveBeenCalledTimes(1)
    expect(extractSchemaToFile).toHaveBeenCalledWith({
      workDir: '/project',
      outputPath: '/project/dist/schema.json',
      workspaceName: undefined,
      enforceRequiredFields: false,
      format: 'groq-type-nodes',
    })

    // Verify telemetry was called with schema stats
    expect(traceMock.start).toHaveBeenCalled()
    expect(traceMock.log).toHaveBeenCalledWith({
      schemaAllTypesCount: 3,
      schemaDocumentTypesCount: 2,
      schemaTypesCount: 1,
      enforceRequiredFields: false,
      schemaFormat: 'groq-type-nodes',
    })
  })

  it('calls telemetry logger during watch mode', async () => {
    const traceMock = {
      start: vi.fn(),
      log: vi.fn(),
      error: vi.fn(),
      complete: vi.fn(),
    }
    const telemetryLogger = {
      trace: vi.fn().mockReturnValue(traceMock),
    }

    const plugin = sanitySchemaExtractionPlugin({
      format: 'groq-type-nodes',
      output: {log: vi.fn(), info: vi.fn(), error: vi.fn()},
      telemetryLogger: telemetryLogger as any,
      enforceRequiredFields: true,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const httpServer = new EventEmitter()

    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: typeof httpServer
    }) => void
    configureServer({watcher, httpServer})

    // Telemetry trace should be started
    expect(telemetryLogger.trace).toHaveBeenCalled()
    expect(traceMock.start).toHaveBeenCalled()
    expect(traceMock.log).toHaveBeenCalledWith({
      step: 'started',
      enforceRequiredFields: true,
      schemaFormat: 'groq-type-nodes',
    })
  })
})
