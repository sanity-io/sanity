import {afterEach, describe, expect, test} from 'vitest'

import {FakeContentLake, type RawListenerEvent} from './fakeContentLake'

const DOCUMENT_ID = 'drafts.article-1'

function listenWhileHolding(lake: FakeContentLake) {
  const received: RawListenerEvent[] = []
  lake.client('B').listener = {mode: 'hold', latencyMs: 0}
  const subscription = lake.listen('B', [DOCUMENT_ID]).subscribe((event) => received.push(event))
  lake.mutateFromOutside([{create: {_id: DOCUMENT_ID, _type: 'article', title: 'one'}}])
  return {received, subscription}
}

function typesOf(events: RawListenerEvent[]): string[] {
  return events.map((event) => event.type)
}

let teardown: (() => void) | undefined
afterEach(() => {
  teardown?.()
  teardown = undefined
})

describe('FakeContentLake reconnect', () => {
  test('a reset drops events held for the dead connection', () => {
    const lake = new FakeContentLake()
    const {received, subscription} = listenWhileHolding(lake)
    teardown = () => subscription.unsubscribe()
    const controls = lake.client('B')

    controls.disconnect()
    controls.reconnect({resume: false})
    controls.listener = {mode: 'auto', latencyMs: 0}
    controls.releaseHeldEvents()

    expect(typesOf(received)).toEqual(['reconnect', 'reset'])
  })

  test('a resumed connection still delivers the held events', () => {
    const lake = new FakeContentLake()
    const {received, subscription} = listenWhileHolding(lake)
    teardown = () => subscription.unsubscribe()
    const controls = lake.client('B')

    controls.disconnect()
    controls.reconnect({resume: true})
    controls.listener = {mode: 'auto', latencyMs: 0}
    controls.releaseHeldEvents()

    expect(typesOf(received)).toEqual(['reconnect', 'welcomeback', 'mutation'])
  })
})
