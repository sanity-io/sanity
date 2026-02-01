import {EventEmitter} from 'node:events'

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {sanityTypegenPlugin} from '../plugin-typegen'

// Mock the @sanity/codegen module
vi.mock('@sanity/codegen', async (importOriginal) => ({
  ...(await importOriginal()),
  runTypegenGenerate: vi.fn().mockResolvedValue({
    code: '',
    queriesCount: 5,
    schemaTypesCount: 10,
    queryFilesCount: 3,
    filesWithErrors: 0,
    typeNodesGenerated: 15,
    unknownTypeNodesGenerated: 0,
    emptyUnionTypeNodesGenerated: 0,
  }),
}))

// Mock fs.existsSync
vi.mock('node:fs', async (importOriginal) => ({
  ...(await importOriginal()),
  existsSync: vi.fn().mockReturnValue(true),
}))

describe('sanityTypegenPlugin', () => {
  let runTypegenGenerate: ReturnType<typeof vi.fn>
  let existsSync: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.useFakeTimers()
    const codegenModule = await import('@sanity/codegen')
    runTypegenGenerate = vi.mocked(codegenModule.runTypegenGenerate)
    runTypegenGenerate.mockReset()
    runTypegenGenerate.mockResolvedValue({
      code: '',
      queriesCount: 5,
      schemaTypesCount: 10,
      queryFilesCount: 3,
      filesWithErrors: 0,
      typeNodesGenerated: 15,
      unknownTypeNodesGenerated: 0,
      emptyUnionTypeNodesGenerated: 0,
    })

    const fsModule = await import('node:fs')
    existsSync = vi.mocked(fsModule.existsSync)
    existsSync.mockReset()
    existsSync.mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs initial generation when httpServer emits listening event', async () => {
    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {},
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

    // No generation yet
    expect(runTypegenGenerate).not.toHaveBeenCalled()

    // Simulate server starting
    httpServer.emit('listening')

    // Still not called - waiting for initial delay (1000ms)
    expect(runTypegenGenerate).not.toHaveBeenCalled()

    // Advance past initial generation delay
    await vi.advanceTimersByTimeAsync(1000)

    expect(runTypegenGenerate).toHaveBeenCalledTimes(1)
    expect(output.info).toHaveBeenCalledWith(expect.anything(), 'Typegen enabled. Watching:')
  })

  it('generates types when a matching query file changes', async () => {
    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {
        path: ['./src/**/*.ts'],
      },
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: null
    }) => void
    configureServer({watcher, httpServer: null})

    expect(runTypegenGenerate).toHaveBeenCalledTimes(0)

    // Trigger change on a query file
    watcher.emit('change', 'src/queries/posts.ts')

    // Advance past debounce (1000ms default)
    await vi.advanceTimersByTimeAsync(1000)
    // Both initial generation (1000ms delay) and debounced change fire together
    expect(runTypegenGenerate).toHaveBeenCalledTimes(2)

    // Trigger another change
    watcher.emit('change', 'src/queries/authors.ts')
    await vi.advanceTimersByTimeAsync(1000)
    expect(runTypegenGenerate).toHaveBeenCalledTimes(3)

    // Trigger a change event unrelated to the watching patterns
    watcher.emit('change', '/other/path/file.ts')
    await vi.advanceTimersByTimeAsync(1000)
    // Should still be 3 since the file doesn't match the pattern
    expect(runTypegenGenerate).toHaveBeenCalledTimes(3)
  })

  it('generates types when schema.json changes', async () => {
    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {
        schema: 'schema.json',
      },
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: null
    }) => void
    configureServer({watcher, httpServer: null})

    expect(runTypegenGenerate).toHaveBeenCalledTimes(0)

    // Trigger change on schema.json (using absolute path as watcher would)
    watcher.emit('change', '/project/schema.json')

    // Advance past debounce (1000ms) - both initial and debounced fire
    await vi.advanceTimersByTimeAsync(1000)
    expect(runTypegenGenerate).toHaveBeenCalledTimes(2)
  })

  it('logs error when schema.json does not exist', async () => {
    existsSync.mockReturnValue(false)

    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {},
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: null
    }) => void
    configureServer({watcher, httpServer: null})

    // Trigger change
    watcher.emit('change', 'src/queries/posts.ts')
    await vi.advanceTimersByTimeAsync(1000)

    // Should not call runTypegenGenerate since schema doesn't exist
    expect(runTypegenGenerate).not.toHaveBeenCalled()

    // Should log error about missing schema
    expect(output.error).toHaveBeenCalledWith(expect.stringContaining('Schema file not found'))
  })

  it('logs warning when generation has errors', async () => {
    // Mock both calls to return errors (initial + debounced)
    const errorResult = {
      code: '',
      queriesCount: 5,
      schemaTypesCount: 10,
      queryFilesCount: 3,
      filesWithErrors: 2,
      typeNodesGenerated: 15,
      unknownTypeNodesGenerated: 0,
      emptyUnionTypeNodesGenerated: 0,
    }
    runTypegenGenerate.mockResolvedValueOnce(errorResult)
    runTypegenGenerate.mockResolvedValueOnce(errorResult)

    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {},
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: null
    }) => void
    configureServer({watcher, httpServer: null})

    watcher.emit('change', 'src/queries/posts.ts')
    await vi.advanceTimersByTimeAsync(1000)

    // Both initial and debounced fire at 1000ms
    expect(runTypegenGenerate).toHaveBeenCalledTimes(2)
    expect(output.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('with errors in 2 files'),
    )
  })

  it('generates types during build via buildEnd hook', async () => {
    vi.useRealTimers()

    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {
        schema: 'schema.json',
        generates: 'sanity.types.ts',
        path: ['./src/**/*.ts'],
      },
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const buildEnd = plugin.buildEnd as () => Promise<void>
    await buildEnd()

    expect(runTypegenGenerate).toHaveBeenCalledTimes(1)
    expect(runTypegenGenerate).toHaveBeenCalledWith({
      workDir: '/project',
      config: expect.objectContaining({
        schema: 'schema.json',
        path: ['./src/**/*.ts'],
        generates: 'sanity.types.ts',
      }),
    })
  })

  it('applies default config values', async () => {
    vi.useRealTimers()

    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {}, // Empty config - should use defaults
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const buildEnd = plugin.buildEnd as () => Promise<void>
    await buildEnd()

    expect(runTypegenGenerate).toHaveBeenCalledWith({
      workDir: '/project',
      config: expect.objectContaining({
        schema: 'schema.json', // default
        generates: 'sanity.types.ts', // default
        overloadClientMethods: false, // default
        formatGeneratedCode: false, // default
      }),
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

    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {},
      output,
      telemetryLogger: telemetryLogger as any,
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
    })
  })

  it('debounces rapid file changes', async () => {
    const output = {log: vi.fn(), info: vi.fn(), error: vi.fn()}
    const plugin = sanityTypegenPlugin({
      workDir: '/project',
      config: {
        path: ['./src/**/*.ts'],
      },
      output,
    })

    const configResolved = plugin.configResolved as (config: {root: string}) => void
    configResolved({root: '/project'})

    const watcher = Object.assign(new EventEmitter(), {add: vi.fn()})
    const configureServer = plugin.configureServer as unknown as (server: {
      watcher: typeof watcher
      httpServer: null
    }) => void
    configureServer({watcher, httpServer: null})

    // Trigger multiple rapid changes
    watcher.emit('change', 'src/queries/posts.ts')
    watcher.emit('change', 'src/queries/authors.ts')
    watcher.emit('change', 'src/queries/categories.ts')

    // Advance past debounce (1000ms)
    await vi.advanceTimersByTimeAsync(1000)

    // Should generate twice: once from initial generation (1000ms delay) and once from debounced changes
    // The multiple rapid changes are debounced into a single call
    expect(runTypegenGenerate).toHaveBeenCalledTimes(2)
  })
})
