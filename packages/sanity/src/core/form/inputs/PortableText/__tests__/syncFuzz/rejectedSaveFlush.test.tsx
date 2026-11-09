import {type PortableTextBlock} from '@sanity/types'
import {afterEach, beforeAll, expect, test} from 'vitest'

import {
  createFuzzTestProvider,
  createHarness,
  FIELD,
  type FuzzTestProvider,
  type Harness,
} from './harness'

const BODY: PortableTextBlock[] = [
  {
    _key: 'b1',
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_key: 's1', _type: 'span', text: 'Hello', marks: []}],
  },
]

const END_OF_HELLO = {path: [{_key: 'b1'}, 'children', {_key: 's1'}], offset: 5}

function textOf(blocks: unknown): string {
  return ((blocks as PortableTextBlock[] | undefined) ?? [])
    .flatMap((block) => (Array.isArray(block.children) ? block.children : []))
    .map((child) => (typeof child.text === 'string' ? child.text : ''))
    .join('')
}

let TestProvider: FuzzTestProvider
let harness: Harness | undefined

beforeAll(async () => {
  TestProvider = await createFuzzTestProvider()
})

afterEach(() => {
  harness?.unmount()
  harness = undefined
})

// The editor still holds "ld" when the save is rejected, and flushes it later as a patch built
// against "Hello wor". Applied to the reset "Hello", it saves "Hellold". Fix belongs in the editor.
test.fails('PT-REJECT-FLUSH (K3, L2): text typed while a rejected save was in flight never reaches the server garbled', async () => {
  harness = await createHarness(BODY, TestProvider)
  harness.editor().send({type: 'select', at: {anchor: END_OF_HELLO, focus: END_OF_HELLO}})
  harness.editor().send({type: 'insert.text', text: ' wor'})
  await harness.advance(1500)
  harness.commit()
  await harness.advance(0)
  harness.editor().send({type: 'insert.text', text: 'ld'})
  await harness.advance(0)

  harness.server.pendingCommits.shift()?.cancel(new Error('Commit rejected with 403'))
  await harness.advance(1500)
  harness.commit()
  await harness.settle()

  expect({
    server: textOf(harness.server.head[FIELD]),
    editor: textOf(harness.editorValue()),
  }).toEqual({server: 'Hello', editor: 'Hello'})
}, 60_000)
