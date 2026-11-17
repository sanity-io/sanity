import {defer, NEVER, Observable, throwError} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createActivityKeepAlive} from './activityKeepAlive'

function source() {
  let active = 0
  const observable = new Observable<never>(() => {
    active++
    return () => {
      active--
    }
  })
  return {
    observable,
    get active() {
      return active
    },
  }
}

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve))

describe('createActivityKeepAlive', () => {
  it('ignores retains while the tool is visible, since those cleanups are unmounts', () => {
    const keepAlive = createActivityKeepAlive()
    const a = source()

    keepAlive.retain(a.observable)

    expect(a.active).toBe(0)
  })

  it('subscribes once per observable while hidden and hands it back after the release commit', async () => {
    const keepAlive = createActivityKeepAlive()
    const a = source()
    keepAlive.setHidden(true)

    keepAlive.retain(a.observable)
    keepAlive.retain(a.observable)
    expect(a.active).toBe(1)

    keepAlive.setHidden(false)
    keepAlive.release(a.observable)
    // Still held until the microtask: the component's own subscription is made first
    expect(a.active).toBe(1)
    await flushMicrotasks()
    expect(a.active).toBe(0)
  })

  it('sweeps what was not retained again during the latest hide', () => {
    const keepAlive = createActivityKeepAlive()
    const stale = source()
    const live = source()

    keepAlive.setHidden(true)
    keepAlive.retain(stale.observable)
    keepAlive.retain(live.observable)
    keepAlive.setHidden(false)
    // Nothing released on this reveal (the owners' effects may run after the sweep)
    keepAlive.sweep()
    expect(stale.active).toBe(1)
    expect(live.active).toBe(1)

    keepAlive.setHidden(true)
    keepAlive.retain(live.observable)
    keepAlive.setHidden(false)
    keepAlive.sweep()
    expect(stale.active).toBe(0)
    expect(live.active).toBe(1)
  })

  it('releases everything when asked to', () => {
    const keepAlive = createActivityKeepAlive()
    const a = source()
    const b = source()
    keepAlive.setHidden(true)
    keepAlive.retain(a.observable)
    keepAlive.retain(b.observable)

    keepAlive.releaseAll()

    expect(a.active).toBe(0)
    expect(b.active).toBe(0)
  })

  it('swallows errors of a held source, which the component handles when it subscribes again', () => {
    const keepAlive = createActivityKeepAlive()
    keepAlive.setHidden(true)

    expect(() => keepAlive.retain(throwError(() => new Error('boom')))).not.toThrow()
    expect(() => keepAlive.retain(defer(() => NEVER))).not.toThrow()
  })
})
