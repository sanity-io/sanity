import {createSanityInstance} from '@sanity/sdk'
import {getNodeState, getOrCreateNode} from '@sanity/sdk/comlink'
import {renderHook} from '@testing-library/react'
import {expect, it, onTestFinished, vi} from 'vitest'

import {useComlinkStore} from '../datastores'
import type * as RenderingContextStoreModule from '../renderingContext/createRenderingContextStore'
import {ResourceCacheProvider} from '../ResourceCacheProvider'

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

const SDK_NODE = {name: 'dashboard/nodes/sdk', connectTo: 'dashboard/channels/sdk'}

// The studio is rendered inside core ui, which provides comlink
vi.mock('../renderingContext/createRenderingContextStore', async (importOriginal) => {
  const actual = await importOriginal<typeof RenderingContextStoreModule>()
  return {
    ...actual,
    createRenderingContextStore: () => actual.createRenderingContextStore(CORE_UI_SEARCH),
  }
})

function stubRenderedInFrame() {
  const top = vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  onTestFinished(() => top.mockRestore())
}

it("keeps using the SDK's node after the SDK hooks using it are gone", () => {
  stubRenderedInFrame()
  vi.useFakeTimers()
  onTestFinished(() => {
    vi.useRealTimers()
  })
  const {result} = renderHook(() => useComlinkStore(), {wrapper: ResourceCacheProvider})
  const instance = createSanityInstance()

  // An SDK hook using the node unmounts, which would release the node after a delay.
  getNodeState(instance, SDK_NODE).observable.subscribe().unsubscribe()
  vi.runOnlyPendingTimers()

  expect(getOrCreateNode(instance, SDK_NODE), "the SDK released Studio's node").toBe(
    result.current.node,
  )
})

it('creates no node outside a frame, where there is no host to talk to', () => {
  const {result} = renderHook(() => useComlinkStore(), {wrapper: ResourceCacheProvider})

  expect(result.current).toEqual({start: expect.any(Function)})
})
