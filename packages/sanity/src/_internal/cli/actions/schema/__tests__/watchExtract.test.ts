import {describe, expect, it, vi} from 'vitest'

import {createExtractionRunner} from '../watchExtract'

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
