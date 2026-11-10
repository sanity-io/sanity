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

function renderWithFlag(enabled: boolean | undefined, source: Observable<never>) {
  return createTestProvider({
    config: {beta: {releaseBackgroundListeners: {enabled}}},
  }).then((TestProvider) =>
    render(
      <TestProvider>
        <ListenerGateController />
        <ListenerConsumer source={source} />
      </TestProvider>,
    ),
  )
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
})
