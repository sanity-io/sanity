import {type CliOutputter} from '@sanity/cli'
import {type FSWatcher} from 'chokidar'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createExtractionRunner, createSchemaWatcher} from '../watchExtract'

// Mock chokidar
vi.mock('chokidar', () => {
  const mockWatcher = {
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
  }
  return {
    default: {
      watch: vi.fn(() => mockWatcher),
    },
  }
})

describe('createExtractionRunner', () => {
  it('runs extraction when not already extracting', async () => {
    const onExtract = vi.fn().mockResolvedValue(undefined)
    const {runExtraction} = createExtractionRunner(onExtract)

    await runExtraction()

    expect(onExtract).toHaveBeenCalledTimes(1)
  })

  it('sets isExtracting to true during extraction', async () => {
    const {state, runExtraction} = createExtractionRunner(async () => {
      expect(state.isExtracting).toBe(true)
    })

    await runExtraction()

    expect(state.isExtracting).toBe(false)
  })

  it('queues pending extraction when called during extraction', async () => {
    let resolveExtraction: () => void
    const extractionPromise = new Promise<void>((resolve) => {
      resolveExtraction = resolve
    })
    const onExtract = vi.fn().mockReturnValue(extractionPromise)
    const {state, runExtraction} = createExtractionRunner(onExtract)

    // Start first extraction
    const firstRun = runExtraction()

    // Try to run another while first is in progress
    const secondRun = runExtraction()

    expect(state.isExtracting).toBe(true)
    expect(state.pendingExtraction).toBe(true)

    // Complete the extraction
    resolveExtraction!()
    await firstRun
    await secondRun

    // Should have run twice (original + pending)
    expect(onExtract).toHaveBeenCalledTimes(2)
  })

  it('coalesces multiple pending requests into one', async () => {
    let resolveExtraction: () => void
    const extractionPromise = new Promise<void>((resolve) => {
      resolveExtraction = resolve
    })
    const onExtract = vi.fn().mockReturnValueOnce(extractionPromise).mockResolvedValue(undefined)
    const {state, runExtraction} = createExtractionRunner(onExtract)

    // Start first extraction
    const firstRun = runExtraction()

    // Queue multiple extractions while first is running
    void runExtraction()
    void runExtraction()
    void runExtraction()

    expect(state.pendingExtraction).toBe(true)

    // Complete the extraction
    resolveExtraction!()
    await firstRun

    // Should only run twice total (1 original + 1 coalesced pending)
    expect(onExtract).toHaveBeenCalledTimes(2)
  })

  it('resets state after extraction error', async () => {
    const error = new Error('Extraction failed')
    const onExtract = vi.fn().mockRejectedValue(error)
    const {state, runExtraction} = createExtractionRunner(onExtract)

    await expect(runExtraction()).rejects.toThrow('Extraction failed')

    expect(state.isExtracting).toBe(false)
    expect(state.pendingExtraction).toBe(false)
  })

  it('processes pending extraction even after error', async () => {
    const error = new Error('First extraction failed')
    let rejectFirst: (e: Error) => void
    const firstPromise = new Promise<void>((_, reject) => {
      rejectFirst = reject
    })

    const onExtract = vi.fn().mockReturnValueOnce(firstPromise).mockResolvedValue(undefined)
    const {runExtraction} = createExtractionRunner(onExtract)

    // Start first extraction
    const firstRun = runExtraction()

    // Queue another while first is running
    void runExtraction()

    // First extraction fails
    rejectFirst!(error)

    // The first run should reject, but pending should still process
    await expect(firstRun).rejects.toThrow('First extraction failed')

    // Wait for pending to complete
    await vi.waitFor(() => {
      expect(onExtract).toHaveBeenCalledTimes(2)
    })
  })
})

describe('createSchemaWatcher', () => {
  let eventHandlers: Record<string, ((...args: unknown[]) => void)[]>
  let chokidarWatch: ReturnType<typeof vi.fn>

  const mockOutput = {
    print: vi.fn(),
    error: vi.fn(),
  } as unknown as CliOutputter

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    eventHandlers = {}

    const chokidar = await import('chokidar')
    const mockWatcher = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!eventHandlers[event]) eventHandlers[event] = []
        eventHandlers[event].push(handler)
        return mockWatcher
      }),
    }
    chokidarWatch = vi.mocked(chokidar.default.watch)
    chokidarWatch.mockReturnValue(mockWatcher as unknown as FSWatcher)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('converts relative patterns to absolute and preserves absolute patterns', async () => {
    await createSchemaWatcher({
      workDir: '/project',
      patterns: ['/absolute/path/*.ts', 'relative/*.ts'],
      debounceMs: 100,
      onExtract: vi.fn(),
      output: mockOutput,
    })

    expect(chokidarWatch).toHaveBeenCalledWith(
      ['/absolute/path/*.ts', '/project/relative/*.ts'],
      expect.objectContaining({ignoreInitial: true, cwd: '/project'}),
    )
  })

  it('debounces file changes and triggers extraction once', async () => {
    const onExtract = vi.fn().mockResolvedValue(undefined)

    await createSchemaWatcher({
      workDir: '/project',
      patterns: ['**/*.ts'],
      debounceMs: 500,
      onExtract,
      output: mockOutput,
    })

    const triggerChange = eventHandlers.all?.[0]

    // Multiple rapid changes
    triggerChange!('change', 'schema/post.ts')
    await vi.advanceTimersByTimeAsync(100)
    triggerChange!('change', 'schema/author.ts')

    // Not called yet (within debounce window)
    expect(onExtract).not.toHaveBeenCalled()

    // Advance past debounce
    await vi.advanceTimersByTimeAsync(500)

    expect(onExtract).toHaveBeenCalledTimes(1)
  })

  it('logs errors from watcher', async () => {
    const errorLog = vi.fn()
    const output = {print: vi.fn(), error: errorLog} as unknown as CliOutputter

    await createSchemaWatcher({
      workDir: '/project',
      patterns: ['**/*.ts'],
      debounceMs: 100,
      onExtract: vi.fn(),
      output,
    })

    eventHandlers.error?.[0]!(new Error('Permission denied'))

    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('Permission denied'))
  })
})
