import {describe, expect, it, vi} from 'vitest'

import {HISTORY_MAX_CONCURRENT_REQUESTS, runWithHistoryRequestSlot} from './historyRequestLimiter'

interface ControlledRequest {
  resolve: (value: string) => void
  reject: (error: Error) => void
}

function startRequests(count: number) {
  const started: number[] = []
  const controls: ControlledRequest[] = []
  const results = Array.from({length: count}, (_, index) =>
    runWithHistoryRequestSlot(
      () =>
        new Promise<string>((resolve, reject) => {
          started.push(index)
          controls[index] = {resolve, reject}
        }),
    ),
  )
  return {started, controls, results}
}

describe('runWithHistoryRequestSlot', () => {
  it('never runs more than the maximum number of requests at once', async () => {
    const {started, controls, results} = startRequests(HISTORY_MAX_CONCURRENT_REQUESTS + 2)

    await vi.waitFor(() => expect(started).toHaveLength(HISTORY_MAX_CONCURRENT_REQUESTS))

    controls[0].resolve('first')
    await expect(results[0]).resolves.toBe('first')
    await vi.waitFor(() => expect(started).toHaveLength(HISTORY_MAX_CONCURRENT_REQUESTS + 1))

    for (const index of started) controls[index].resolve(`done-${index}`)
    await vi.waitFor(() => expect(started).toHaveLength(HISTORY_MAX_CONCURRENT_REQUESTS + 2))
    controls.at(-1)?.resolve('last')
    await Promise.all(results)
  })

  it('starts waiting requests in the order they were made', async () => {
    const {started, controls, results} = startRequests(HISTORY_MAX_CONCURRENT_REQUESTS + 3)
    await vi.waitFor(() => expect(started).toHaveLength(HISTORY_MAX_CONCURRENT_REQUESTS))

    controls[2].resolve('done')
    controls[0].resolve('done')
    controls[1].resolve('done')

    await vi.waitFor(() =>
      expect(started.slice(HISTORY_MAX_CONCURRENT_REQUESTS)).toEqual([
        HISTORY_MAX_CONCURRENT_REQUESTS,
        HISTORY_MAX_CONCURRENT_REQUESTS + 1,
        HISTORY_MAX_CONCURRENT_REQUESTS + 2,
      ]),
    )

    for (const index of started) controls[index].resolve('done')
    await Promise.all(results)
  })

  it('frees the slot of a request that fails and passes the error on', async () => {
    const {started, controls, results} = startRequests(HISTORY_MAX_CONCURRENT_REQUESTS + 1)
    await vi.waitFor(() => expect(started).toHaveLength(HISTORY_MAX_CONCURRENT_REQUESTS))

    const error = new Error('Too many requests')
    controls[0].reject(error)

    await expect(results[0]).rejects.toBe(error)
    await vi.waitFor(() => expect(started).toHaveLength(HISTORY_MAX_CONCURRENT_REQUESTS + 1))

    for (const index of started.slice(1)) controls[index].resolve('done')
    await Promise.all(results.slice(1))
  })
})
