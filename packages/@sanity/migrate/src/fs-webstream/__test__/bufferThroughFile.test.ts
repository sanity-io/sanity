/* eslint-disable no-constant-condition */
import {stat} from 'node:fs/promises'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {decodeText, parse} from '../../it-utils'
import {firstValueFrom} from '../../it-utils/firstValueFrom'
import {lastValueFrom} from '../../it-utils/lastValueFrom'
import {asyncIterableToStream} from '../../utils/asyncIterableToStream'
import {streamToAsyncIterator} from '../../utils/streamToAsyncIterator'
import {bufferThroughFile} from '../bufferThroughFile'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let id = 0
const getTestBufferFileName = () => path.join(__dirname, '.tmp', `buffer-${id++}.ndjson`)

describe('using primary stream', () => {
  test('stops buffering when the consumer is done', async () => {
    const encoder = new TextEncoder()

    async function* gen() {
      for (let n = 0; n < 100; n++) {
        yield encoder.encode(`{"foo": ${n},`)
        // simulate a bit of delay in the producer (which is often the case)
        await sleep(1)
        yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
        yield encoder.encode('\n')
      }
    }

    const bufferFile = getTestBufferFileName()
    const abortController = new AbortController()
    const createReader = bufferThroughFile(asyncIterableToStream(gen()), bufferFile, {
      signal: abortController.signal,
      keepFile: true,
    })
    const fileBufferStream = createReader()
    const lines = []
    for await (const chunk of parse(decodeText(streamToAsyncIterator(fileBufferStream)))) {
      lines.push(chunk)
      if (lines.length === 3) {
        // we only pick 3 lines and break out of the iteration. This should stop the buffering
        break
      }
      // simulate a slow consumer
      // (the bufferThroughFile stream should still continue to write to the file as fast as possible)
      await sleep(10)
    }

    expect(lines).toEqual([
      {bar: 0, baz: 0, foo: 0},
      {bar: 1, baz: 1, foo: 1},
      {bar: 2, baz: 2, foo: 2},
    ])

    // Note: the stream needs to be explicitly aborted, otherwise the source stream will run to completion
    // would be nice if there was a way to "unref()" the file handle to prevent it from blocking the process,
    // but I don't think there is
    abortController.abort()

    // This asserts that buffer file contains more bytes than the 3 lines above represents
    const bufferFileSize = (await stat(bufferFile)).size

    expect(bufferFileSize).toBeGreaterThan(90)
    // but not the full 100 lines
    expect(bufferFileSize).toBeLessThan(3270)
  })

  test('it runs to completion if consumer needs it', async () => {
    const encoder = new TextEncoder()

    async function* gen() {
      for (let n = 0; n < 100; n++) {
        yield encoder.encode(`{"foo": ${n},`)
        // simulate a bit of delay in the producer (which is often the case)
        await sleep(1)
        yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
        yield encoder.encode('\n')
      }
    }

    const bufferFile = getTestBufferFileName()
    const controller = new AbortController()
    const createReader = bufferThroughFile(asyncIterableToStream(gen()), bufferFile, {
      signal: controller.signal,
      keepFile: true,
    })
    const fileBufferStream = createReader()
    const lines = []
    for await (const chunk of parse(decodeText(streamToAsyncIterator(fileBufferStream)))) {
      if (lines.length < 3) {
        // in contrast to the test above, we don't break out of the iteration early, but let it run to completion
        lines.push(chunk)
      }
    }

    expect(lines).toEqual([
      {bar: 0, baz: 0, foo: 0},
      {bar: 1, baz: 1, foo: 1},
      {bar: 2, baz: 2, foo: 2},
    ])

    // This asserts that buffer file contains all the yielded lines
    expect((await stat(bufferFile)).size).toBe(3270)
  })
})

describe('using secondary stream', () => {
  test('stops buffering when the consumer is done', async () => {
    const encoder = new TextEncoder()

    async function* gen() {
      for (let n = 0; n < 100; n++) {
        yield encoder.encode(`{"foo": ${n},`)
        // simulate a bit of delay in the producer (which is often the case)
        yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
        yield encoder.encode('\n')
      }
    }

    const bufferFile = getTestBufferFileName()
    const abortController = new AbortController()
    const createReader = bufferThroughFile(asyncIterableToStream(gen()), bufferFile, {
      signal: abortController.signal,
      keepFile: true,
    })
    const fileBufferStream = createReader()

    const lines = []
    for await (const chunk of parse(decodeText(streamToAsyncIterator(fileBufferStream)))) {
      lines.push(chunk)
      lines.push(await lastValueFrom(parse(decodeText(streamToAsyncIterator(createReader())))))
      if (lines.length === 6) {
        break
      }
    }

    abortController.abort()

    expect(lines).toEqual([
      {bar: 0, baz: 0, foo: 0},
      {bar: 99, baz: 99, foo: 99},
      {bar: 1, baz: 1, foo: 1},
      {bar: 99, baz: 99, foo: 99},
      {bar: 2, baz: 2, foo: 2},
      {bar: 99, baz: 99, foo: 99},
    ])
  })

  test('ends when the primary stream completes', async () => {
    const encoder = new TextEncoder()

    async function* gen() {
      for (let n = 0; n < 100; n++) {
        yield encoder.encode(`{"foo": ${n},`)
        yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
        yield encoder.encode('\n')
      }
    }

    const bufferFile = getTestBufferFileName()
    const createReader = bufferThroughFile(asyncIterableToStream(gen()), bufferFile)
    const primary = createReader()
    const first = firstValueFrom(parse(decodeText(streamToAsyncIterator(primary))))
    const last = lastValueFrom(parse(decodeText(streamToAsyncIterator(createReader()))))

    expect(await first).toEqual({bar: 0, baz: 0, foo: 0})

    expect(await last).toEqual({bar: 99, baz: 99, foo: 99})
  })

  test('throws if a new stream is created after abortion', async () => {
    const encoder = new TextEncoder()

    async function* gen() {
      for (let n = 0; n < 100; n++) {
        yield encoder.encode(`{"foo": ${n},`)
        yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
        yield encoder.encode('\n')
      }
    }

    const bufferFile = getTestBufferFileName()
    const controller = new AbortController()
    const createReader = bufferThroughFile(asyncIterableToStream(gen()), bufferFile, {
      signal: controller.signal,
      keepFile: true,
    })
    const primary = createReader()
    const first = await firstValueFrom(parse(decodeText(streamToAsyncIterator(primary))))

    expect(first).toEqual({bar: 0, baz: 0, foo: 0})

    await primary.cancel()

    controller.abort()

    await expect(() =>
      lastValueFrom(parse(decodeText(streamToAsyncIterator(createReader())))),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot create new buffered readers on aborted stream]`,
    )
  })
})

describe('cleanup', () => {
  test('cleans up the file after cancel', async () => {
    const encoder = new TextEncoder()

    async function* gen() {
      for (let n = 0; n < 100; n++) {
        yield encoder.encode(`{"foo": ${n},`)
        yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
        yield encoder.encode('\n')
      }
    }

    const bufferFile = getTestBufferFileName()
    const controller = new AbortController()
    const createReader = bufferThroughFile(asyncIterableToStream(gen()), bufferFile, {
      signal: controller.signal,
    })
    const reader = createReader()

    const first = await firstValueFrom(parse(decodeText(streamToAsyncIterator(reader))))

    expect(first).toEqual({bar: 0, baz: 0, foo: 0})

    await reader.cancel()

    await sleep(10)
    await expect(stat(bufferFile)).rejects.toThrow('ENOENT')
  })
  test('cleans up after the abortController aborts', async () => {
    const encoder = new TextEncoder()

    async function* gen() {
      for (let n = 0; n < 100; n++) {
        yield encoder.encode(`{"foo": ${n},`)
        yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
        yield encoder.encode('\n')
      }
    }

    const bufferFile = getTestBufferFileName()
    const controller = new AbortController()
    const createReader = bufferThroughFile(asyncIterableToStream(gen()), bufferFile, {
      signal: controller.signal,
    })

    const firstReader = createReader()

    const first = await firstValueFrom(parse(decodeText(streamToAsyncIterator(firstReader))))

    expect(first).toEqual({bar: 0, baz: 0, foo: 0})

    const second = await lastValueFrom(parse(decodeText(streamToAsyncIterator(firstReader))))
    expect(second).toEqual({bar: 99, baz: 99, foo: 99})

    controller.abort()

    await sleep(10)
    await expect(stat(bufferFile)).rejects.toThrow('ENOENT')
  })
})
