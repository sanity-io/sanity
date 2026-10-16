import {firstValueFrom} from 'rxjs'
import {describe, expect, it, onTestFinished, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {getMessageBusConnection} from '../messageBus/getMessageBusConnection'
import {createRenderingContextStore} from './createRenderingContextStore'
import {type CapabilityRecord} from './types'

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

describe('renderingContext', () => {
  it('emits rendering context', async () => {
    const {renderingContext} = createRenderingContextStore()

    expect(await firstValueFrom(renderingContext)).toEqual({
      name: 'default',
      metadata: {},
    })
  })

  it('resolves the rendering context synchronously when the store is created', () => {
    expect(createRenderingContextStore().getRenderingContext()).toEqual({
      name: 'default',
      metadata: {},
    })
    expect(createRenderingContextStore(CORE_UI_SEARCH).getRenderingContext()).toEqual({
      name: 'coreUi',
      metadata: {environment: 'test'},
    })
  })
})

function stubRenderedInFrame() {
  const top = vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  onTestFinished(() => top.mockRestore())
}

describe('capabilities', () => {
  it('emits capabilities', async () => {
    const {capabilities} = createRenderingContextStore()
    expect(await firstValueFrom(capabilities)).toEqual({})
  })

  it('resolves the capabilities synchronously when the store is created', () => {
    expect(createRenderingContextStore().getCapabilities()).toEqual({})
  })

  it('provides no comlink or dashboard for a `core-ui` URL opened outside a frame', () => {
    expect(createRenderingContextStore(CORE_UI_SEARCH).getCapabilities()).toEqual({
      globalUserMenu: true,
      globalWorkspaceControl: true,
    })
  })

  it('provides no dashboard in a frame without a `core-ui` URL', () => {
    stubRenderedInFrame()

    expect(createRenderingContextStore().getCapabilities()).toEqual({})
  })

  it('provides every host capability for a `core-ui` URL rendered in a frame', () => {
    stubRenderedInFrame()

    expect(createRenderingContextStore(CORE_UI_SEARCH).getCapabilities()).toEqual({
      globalUserMenu: true,
      globalWorkspaceControl: true,
      comlink: true,
      dashboard: true,
      favorites: true,
      history: true,
    })
  })
})

describe('with a message bus host', () => {
  it('provides messageBus and dashboard before the host publishes, then follows the host', () => {
    const host = stubMessageBusHost()
    const {capabilities, getCapabilities} = createRenderingContextStore()
    const emitted: CapabilityRecord[] = []
    capabilities.subscribe((value) => emitted.push(value))

    host.publish('applications.capabilities', {globalUserMenu: true})
    host.publish('applications.capabilities', {})

    expect(emitted).toEqual([
      {messageBus: true, dashboard: true},
      {globalUserMenu: true, messageBus: true, dashboard: true},
      {messageBus: true, dashboard: true},
    ])
    expect(getCapabilities()).toEqual({messageBus: true, dashboard: true})
  })

  it('reads every capability the host published before Studio loaded', () => {
    const host = stubMessageBusHost()
    host.publish('applications.capabilities', {
      globalUserMenu: true,
      favorites: true,
      history: true,
    })
    const expected: CapabilityRecord = {
      globalUserMenu: true,
      favorites: true,
      history: true,
      messageBus: true,
      dashboard: true,
    }

    expect(createRenderingContextStore().getCapabilities()).toEqual(expected)
  })

  it('reads the same capabilities object during render as it emits', () => {
    const host = stubMessageBusHost()
    host.publish('applications.capabilities', {globalUserMenu: true})
    const {capabilities, getCapabilities} = createRenderingContextStore()
    const emitted: CapabilityRecord[] = []

    capabilities.subscribe((value) => emitted.push(value))

    expect(emitted).toEqual([getCapabilities()])
    expect(emitted[0]).toBe(getCapabilities())
  })

  it('hands out the connection of a message bus host only', () => {
    expect(createRenderingContextStore().getMessageBusConnection()).toBeUndefined()

    stubMessageBusHost()

    expect(createRenderingContextStore().getMessageBusConnection()).toBe(getMessageBusConnection())
    expect(createRenderingContextStore(CORE_UI_SEARCH).getMessageBusConnection()).toBeUndefined()
  })

  it('prefers the `core-ui` URL context over a message bus host', () => {
    stubMessageBusHost()

    const {getRenderingContext, getCapabilities} = createRenderingContextStore(CORE_UI_SEARCH)

    expect(getRenderingContext()?.name).toBe('coreUi')
    expect(getCapabilities()).toEqual({
      globalUserMenu: true,
      globalWorkspaceControl: true,
    })
  })
})
