import {describe, expect, it} from 'vitest'
import {createActor, SimulatedClock} from 'xstate'

import {RELEVANCE_ORDERING_ID} from '../DocumentListPaneSearchOrdering'
import {documentListSearchMachine} from '../documentListSearchMachine'

function createHarness() {
  const clock = new SimulatedClock()
  const actor = createActor(documentListSearchMachine, {clock, input: {paneKey: 'pane-a'}})
  actor.start()
  return {
    actor,
    clock,
    type: (value: string) => actor.send({type: 'input changed', value}),
    context: () => actor.getSnapshot().context,
    state: () => actor.getSnapshot().value,
  }
}

describe('documentListSearchMachine', () => {
  it('applies a typed query after the debounce', () => {
    const harness = createHarness()

    harness.type('auth')
    expect(harness.state()).toBe('debouncing')
    expect(harness.context().inputValue).toBe('auth')
    expect(harness.context().searchQuery).toBe('')

    harness.clock.increment(300)
    expect(harness.state()).toBe('active')
    expect(harness.context().searchQuery).toBe('auth')
  })

  it('restarts the debounce per keystroke and applies the latest value', () => {
    const harness = createHarness()

    harness.type('a')
    harness.clock.increment(200)
    harness.type('au')
    harness.clock.increment(200)
    expect(harness.context().searchQuery).toBe('')

    harness.clock.increment(100)
    expect(harness.context().searchQuery).toBe('au')
  })

  it('clears immediately without waiting for the debounce', () => {
    const harness = createHarness()

    harness.type('auth')
    harness.clock.increment(300)
    harness.type('')
    expect(harness.state()).toBe('idle')
    expect(harness.context().inputValue).toBe('')
    expect(harness.context().searchQuery).toBe('')
  })

  it('resets the ordering whenever the search clears', () => {
    const harness = createHarness()

    harness.type('auth')
    harness.clock.increment(300)
    harness.actor.send({type: 'ordering selected', orderingId: 'title-asc'})
    expect(harness.context().orderingId).toBe('title-asc')

    harness.type('autho')
    harness.clock.increment(300)
    expect(harness.context().orderingId).toBe('title-asc')

    harness.type('')
    expect(harness.context().orderingId).toBe(RELEVANCE_ORDERING_ID)
  })

  it('treats a whitespace-only query as cleared but keeps it applied', () => {
    const harness = createHarness()

    harness.type('auth')
    harness.clock.increment(300)
    harness.actor.send({type: 'ordering selected', orderingId: 'title-asc'})

    harness.type('   ')
    harness.clock.increment(300)
    expect(harness.state()).toBe('idle')
    expect(harness.context().searchQuery).toBe('   ')
    expect(harness.context().orderingId).toBe(RELEVANCE_ORDERING_ID)
  })

  it('resets everything atomically when the pane changes', () => {
    const harness = createHarness()

    harness.type('auth')
    harness.clock.increment(300)
    harness.actor.send({type: 'ordering selected', orderingId: 'title-asc'})
    harness.actor.send({type: 'list settled'})
    expect(harness.context().spinnerEnabled).toBe(true)

    harness.actor.send({type: 'pane changed', paneKey: 'pane-b'})
    expect(harness.state()).toBe('idle')
    expect(harness.context()).toEqual({
      paneKey: 'pane-b',
      inputValue: '',
      searchQuery: '',
      orderingId: RELEVANCE_ORDERING_ID,
      spinnerEnabled: false,
    })
  })

  it('ignores pane events for the current pane', () => {
    const harness = createHarness()

    harness.type('auth')
    harness.clock.increment(300)
    harness.actor.send({type: 'pane changed', paneKey: 'pane-a'})

    expect(harness.state()).toBe('active')
    expect(harness.context().searchQuery).toBe('auth')
  })

  it('arms the spinner once the list settles', () => {
    const harness = createHarness()

    expect(harness.context().spinnerEnabled).toBe(false)
    harness.actor.send({type: 'list settled'})
    expect(harness.context().spinnerEnabled).toBe(true)
  })

  it('keeps the previous query applied while typing a new one', () => {
    const harness = createHarness()

    harness.type('auth')
    harness.clock.increment(300)
    harness.type('autho')
    expect(harness.state()).toBe('debouncing')
    expect(harness.context().searchQuery).toBe('auth')
    expect(harness.context().inputValue).toBe('autho')
  })
})
