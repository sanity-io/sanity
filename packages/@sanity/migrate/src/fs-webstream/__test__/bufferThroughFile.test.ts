/* eslint-disable no-constant-condition */
import {stat} from 'node:fs/promises'

import {bufferThroughFile} from '../bufferThroughFile'
import {ndjson} from '../../it-utils'
import {streamAsyncIterator} from '../../utils/streamToAsyncIterator'
import {asyncIterableToStream} from '../../utils/asyncIterableToStream'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('stops buffering when the consumer is done', async () => {
  const encoder = new TextEncoder()
  async function* gen() {
    for (let n = 0; n < 1000; n++) {
      yield encoder.encode(`{"foo": ${n},`)
      // simulate a bit of delay in the producer (which is often the case)
      await sleep(10)
      yield encoder.encode(`"bar": ${n}, "baz": ${n}}`)
      yield encoder.encode('\n')
    }
  }

  const bufferFile = `${__dirname}/partial.ndjson`
  const fileBufferStream = bufferThroughFile(asyncIterableToStream(gen()), bufferFile)

  const lines = []
  for await (const chunk of ndjson(streamAsyncIterator(fileBufferStream))) {
    lines.push(chunk)
    if (lines.length === 3) {
      // we only pick 3 lines and break out of the iteration. This should stop the buffering
      break
    }
    // simulate a slow consumer
    // (the bufferThroughFile stream should still continue to write to the file as fast as possible)
    await sleep(50)
  }

  expect(lines).toEqual([
    {bar: 0, baz: 0, foo: 0},
    {bar: 1, baz: 1, foo: 1},
    {bar: 2, baz: 2, foo: 2},
  ])

  // Note: the stream needs to be explicitly cancelled, otherwise the source stream will run to completion
  // would be nice if there was a way to "unref()" the file handle to prevent it from blocking the process,
  // but I don't think there is
  await fileBufferStream.cancel()

  // This asserts that buffer file contains more bytes than the 3 lines above represents
  const bufferFileSize = (await stat(bufferFile)).size

  expect(bufferFileSize).toBeGreaterThan(90)
  // but not the full 1000 lines
  expect(bufferFileSize).toBe(311)
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

  const bufferFile = `${__dirname}/full.ndjson`
  const fileBufferStream = bufferThroughFile(asyncIterableToStream(gen()), bufferFile)

  const lines = []
  for await (const chunk of ndjson(streamAsyncIterator(fileBufferStream))) {
    if (lines.length < 3) {
      // in contrast to the test above, we don't break out of the iteration early, but let it run to completion
      lines.push(chunk)
    }
  }
  await fileBufferStream.cancel()

  expect(lines).toEqual([
    {bar: 0, baz: 0, foo: 0},
    {bar: 1, baz: 1, foo: 1},
    {bar: 2, baz: 2, foo: 2},
  ])

  // This asserts that buffer file contains all the yielded lines
  expect((await stat(bufferFile)).size).toBe(3270)
})
