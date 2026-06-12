import {firstValueFrom, from, toArray} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type Message} from './proxy'
import {dropMutations, duplicateMutations, randomLatency, sendReset} from './scenarios'

function mutation(id: string): Message {
  return {type: 'message', message: {event: 'mutation', id, data: '{}'}}
}

function welcome(): Message {
  return {type: 'message', message: {event: 'welcome', data: '{}'}}
}

describe('dropMutations', () => {
  test('drops every mutation at probability 1, keeps non-mutations', async () => {
    const input = [welcome(), mutation('a'), mutation('b')]
    const out = await firstValueFrom(from(input).pipe(dropMutations(1), toArray()))
    expect(out).toEqual([welcome()])
  })

  test('drops nothing at probability 0', async () => {
    const input = [welcome(), mutation('a'), mutation('b')]
    const out = await firstValueFrom(from(input).pipe(dropMutations(0), toArray()))
    expect(out).toEqual(input)
  })
})

describe('duplicateMutations', () => {
  test('duplicates every mutation at probability 1, leaves others alone', async () => {
    const input = [welcome(), mutation('a')]
    const out = await firstValueFrom(from(input).pipe(duplicateMutations(1), toArray()))
    expect(out).toEqual([welcome(), mutation('a'), mutation('a')])
  })
})

describe('sendReset', () => {
  test('rewrites mutations to reset events at probability 1', async () => {
    const input = [welcome(), mutation('a')]
    const out = (await firstValueFrom(from(input).pipe(sendReset(1), toArray()))) as Message[]
    expect(out[0]).toEqual(welcome())
    expect(out[1]?.message.event).toBe('reset')
    // preserves the original event id
    expect(out[1]?.message.id).toBe('a')
  })
})

describe('randomLatency', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('delays each event but emits all of them', async () => {
    const input = [mutation('a'), mutation('b'), mutation('c')]
    const promise = firstValueFrom(from(input).pipe(randomLatency(100, 200), toArray()))
    await vi.advanceTimersByTimeAsync(200)
    const out = (await promise) as Message[]
    expect(out).toHaveLength(3)
    expect(out.map((e) => e.message.id ?? '').sort((a, b) => a.localeCompare(b))).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})
