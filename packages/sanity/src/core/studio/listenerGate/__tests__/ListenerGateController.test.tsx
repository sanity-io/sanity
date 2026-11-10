import {render} from '@testing-library/react'
import {useEffect} from 'react'
import {firstValueFrom, Observable} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {listenerGate, pauseWhileDocumentHidden} from '../../../store/listenerGate/listenerGate'
import {ListenerGateController} from '../ListenerGateController'

function createListener() {
  const state = {connections: 0}
  const source = new Observable<never>(() => {
    state.connections++
  })
  return {source, state}
}

/** Subscribes from a passive effect, like `useObservable` does */
function ListenerConsumer({source}: {source: Observable<never>}) {
  useEffect(() => {
    const subscription = source.pipe(pauseWhileDocumentHidden()).subscribe()
    return () => subscription.unsubscribe()
  }, [source])
  return null
}

async function renderWithFlag(
  enabled: boolean | undefined,
  source: Observable<never>,
  {controllers = ['controller']}: {controllers?: string[]} = {},
) {
  const TestProvider = await createTestProvider({
    config: {beta: {releaseBackgroundListeners: {enabled}}},
  })
  const tree = (keys: string[]) => (
    <TestProvider>
      {keys.map((key) => (
        <ListenerGateController key={key} />
      ))}
      <ListenerConsumer source={source} />
    </TestProvider>
  )
  const view = render(tree(controllers))
  return {
    ...view,
    /** Renders the controllers with these keys, so a changed key remounts its controller */
    setControllers: (keys: string[]) => view.rerender(tree(keys)),
  }
}

beforeEach(() => {
  // A tab opened in the background
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ListenerGateController', () => {
  it('keeps a hidden page from connecting listeners when the workspace enables the gate', async () => {
    const listener = createListener()
    const {unmount} = await renderWithFlag(true, listener.source)

    expect(await firstValueFrom(listenerGate.active$)).toBe(false)
    expect(listener.state.connections).toBe(0)

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(listener.state.connections).toBe(1)

    unmount()
  })

  it('connects listeners on a hidden page when the workspace does not enable the gate', async () => {
    const listener = createListener()
    const {unmount} = await renderWithFlag(undefined, listener.source)

    expect(await firstValueFrom(listenerGate.active$)).toBe(true)
    expect(listener.state.connections).toBe(1)

    unmount()
  })

  it('disables the gate when the workspace unmounts', async () => {
    const {unmount} = await renderWithFlag(true, createListener().source)
    expect(await firstValueFrom(listenerGate.active$)).toBe(false)

    unmount()
    expect(await firstValueFrom(listenerGate.active$)).toBe(true)
  })

  it('keeps the gate on while another Studio on the page still has it on', async () => {
    const listener = createListener()
    const {unmount, setControllers} = await renderWithFlag(true, listener.source, {
      controllers: ['first', 'second'],
    })

    setControllers(['second'])
    expect(await firstValueFrom(listenerGate.active$)).toBe(false)
    expect(listener.state.connections).toBe(0)

    setControllers([])
    expect(await firstValueFrom(listenerGate.active$)).toBe(true)
    expect(listener.state.connections).toBe(1)

    unmount()
  })

  it('keeps a hold when the controller remounts', async () => {
    const listener = createListener()
    const {unmount, setControllers} = await renderWithFlag(true, listener.source, {
      controllers: ['before'],
    })
    const release = listenerGate.acquireHold()
    expect(listener.state.connections).toBe(1)

    // A workspace switch unmounts one controller and mounts another in the same commit
    setControllers(['after'])
    expect(await firstValueFrom(listenerGate.active$)).toBe(true)
    expect(listener.state.connections).toBe(1)

    release()
    expect(await firstValueFrom(listenerGate.active$)).toBe(false)

    unmount()
  })
})
