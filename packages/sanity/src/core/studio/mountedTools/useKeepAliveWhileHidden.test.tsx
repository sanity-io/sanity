import {act, render, screen} from '@testing-library/react'
import {Activity} from 'react'
import {useSyncObservable} from 'react-rx'
import {
  concat,
  defer,
  finalize,
  map,
  NEVER,
  type Observable,
  ReplaySubject,
  share,
  startWith,
  timer,
} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {ActivityKeepAliveProvider} from './ActivityKeepAliveProvider'
import {useKeepAliveWhileHidden} from './useKeepAliveWhileHidden'

/**
 * Like the document stores: a long-lived, reference counted source that starts over, loading
 * state first, once its last subscriber is gone. `active` is 1 while it is connected.
 */
function createSource() {
  const subscribe = vi.fn()
  let active = 0
  const observable = defer(() => {
    subscribe()
    active++
    return concat(timer(5).pipe(map(() => 'ready')), NEVER).pipe(finalize(() => active--))
  }).pipe(
    startWith('loading'),
    share({connector: () => new ReplaySubject(1), resetOnRefCountZero: true}),
  )
  return {
    observable,
    subscribe,
    get active() {
      return active
    },
  }
}

function Reader({
  observable,
  onRender,
}: {
  observable: Observable<string>
  onRender: (v: string) => void
}) {
  useKeepAliveWhileHidden(observable)
  const value = useSyncObservable(observable, 'loading')
  onRender(value)
  return <output>{value}</output>
}

function Tool({
  hidden,
  observable,
  onRender,
}: {
  hidden: boolean
  observable: Observable<string>
  onRender: (v: string) => void
}) {
  return (
    <ActivityKeepAliveProvider hidden={hidden}>
      <Activity mode={hidden ? 'hidden' : 'visible'}>
        <Reader observable={observable} onRender={onRender} />
      </Activity>
    </ActivityKeepAliveProvider>
  )
}

// Wall-clock on purpose: react-rx resets a shared source on the asap scheduler (a microtask),
// which fake timers would not advance together with `timer(5)`.
async function settle(ms = 20) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

describe('useKeepAliveWhileHidden', () => {
  it('keeps the source subscribed through a hidden period, so reveal does not start it over', async () => {
    const {observable, subscribe} = createSource()
    const rendered: string[] = []
    const onRender = (value: string) => rendered.push(value)
    const {rerender} = render(<Tool hidden={false} observable={observable} onRender={onRender} />)
    await settle()
    expect(screen.getByRole('status')).toHaveTextContent('ready')
    expect(subscribe).toHaveBeenCalledTimes(1)

    rerender(<Tool hidden observable={observable} onRender={onRender} />)
    await settle()
    rendered.length = 0
    rerender(<Tool hidden={false} observable={observable} onRender={onRender} />)
    await settle()

    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(rendered).not.toContain('loading')
    expect(screen.getByRole('status')).toHaveTextContent('ready')
  })

  it('lets the source go when the hidden tool is unmounted', async () => {
    const {observable, subscribe} = createSource()
    const {rerender, unmount} = render(
      <Tool hidden={false} observable={observable} onRender={() => undefined} />,
    )
    await settle()
    rerender(<Tool hidden observable={observable} onRender={() => undefined} />)
    await settle()

    unmount()
    render(<Tool hidden={false} observable={observable} onRender={() => undefined} />)
    await settle()

    // A fresh subscription, so the source was released by the unmount rather than leaked
    expect(subscribe).toHaveBeenCalledTimes(2)
  })

  it('releases a source that a hidden re-render swapped out when the tool is shown again', async () => {
    const first = createSource()
    const second = createSource()
    const tool = (hidden: boolean, observable: Observable<string>) => (
      <Tool hidden={hidden} observable={observable} onRender={() => undefined} />
    )
    const {rerender} = render(tool(false, first.observable))
    await settle()
    rerender(tool(true, first.observable))
    await settle()
    // A hidden tool still re-renders when context changes; `useEditState` swaps its observable
    // when the perspective does.
    rerender(tool(true, second.observable))
    await settle()
    expect(first.active).toBe(1)

    rerender(tool(false, second.observable))
    await settle()

    expect(screen.getByRole('status')).toHaveTextContent('ready')
    expect(first.active).toBe(0)
    expect(second.active).toBe(1)
  })

  it('does not hold on to a source whose component unmounts while the tool is visible', async () => {
    const {observable, subscribe} = createSource()
    function Conditional({mounted}: {mounted: boolean}) {
      return (
        <ActivityKeepAliveProvider hidden={false}>
          {mounted && <Reader observable={observable} onRender={() => undefined} />}
        </ActivityKeepAliveProvider>
      )
    }
    const {rerender} = render(<Conditional mounted />)
    await settle()
    rerender(<Conditional mounted={false} />)
    await settle()
    rerender(<Conditional mounted />)
    await settle()

    expect(subscribe).toHaveBeenCalledTimes(2)
  })
})
