import {expect, test} from 'vitest'

import {readFileAsWebStream} from '../../fs-webstream/readFileAsWebStream'
import {toArray} from '../../it-utils/toArray'
import {concatUint8Arrays} from '../../uint8arrays'
import {streamToAsyncIterator} from '../../utils/streamToAsyncIterator'
import {drain} from '../drain'
import {untar} from '../untar'

function getCrypto() {
  if (typeof globalThis.crypto === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('node:crypto').webcrypto
  }
  return globalThis.crypto
}

async function shasum(data: Uint8Array) {
  const {subtle} = getCrypto()
  const digest = await subtle.digest('SHA-256', data)
  return hex(new Uint8Array(digest))
}
async function hex(data: Uint8Array) {
  return Array.from(data)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('')
}

// Sample file to verify checksum against
const file = `7eeec7b86ddfefd7d7b66e137b2b9220a527528f-185x278.jpg`

test('untar movies dataset export', async () => {
  const fileStream = readFileAsWebStream(`${__dirname}/fixtures/movies.tar`)

  for await (const [header, body] of streamToAsyncIterator(untar(fileStream))) {
    if (header.name.includes(file)) {
      const chunks = await toArray(streamToAsyncIterator(body))
      const sum = await shasum(concatUint8Arrays(chunks))
      expect(sum).toEqual('02c936cda5695fa4f43f5dc919c1f55c362faa6dd558dfb2d77d524f004069db')
    } else {
      await drain(body)
    }
  }
})
