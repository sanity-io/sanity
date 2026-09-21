import {createNode} from '@sanity/comlink'
import {render} from '@testing-library/react'
import {beforeEach, expect, it, vi} from 'vitest'

import {useComlinkStore} from '../datastores'
import type * as RenderingContextStoreModule from '../renderingContext/createRenderingContextStore'
import {ResourceCacheProvider} from '../ResourceCacheProvider'

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

const nodeStart = vi.fn(() => vi.fn())
vi.mock('@sanity/comlink', () => ({
  createNode: vi.fn(() => ({start: nodeStart})),
}))

// The studio is rendered inside core ui, which provides comlink
vi.mock('../renderingContext/createRenderingContextStore', async (importOriginal) => {
  const actual = await importOriginal<typeof RenderingContextStoreModule>()
  return {
    ...actual,
    createRenderingContextStore: () => actual.createRenderingContextStore(CORE_UI_SEARCH),
  }
})

beforeEach(() => {
  vi.mocked(createNode).mockClear()
  nodeStart.mockClear()
})

it('creates the comlink node for the mounting render but starts it only on commit', () => {
  const startsSeenWhileRendering: number[] = []
  function Consumer() {
    const {node} = useComlinkStore()
    startsSeenWhileRendering.push(nodeStart.mock.calls.length)
    return <span data-node={node ? 'yes' : 'no'} />
  }

  const {container} = render(
    <ResourceCacheProvider>
      <Consumer />
      <Consumer />
    </ResourceCacheProvider>,
  )

  // the capabilities are resolved up front, so the node exists from the first render on...
  expect(container.querySelectorAll('[data-node="yes"]')).toHaveLength(2)
  expect(createNode).toHaveBeenCalledTimes(1)
  // ...but no render — a render React may abandon — started it; the commit did, once for both consumers
  expect(startsSeenWhileRendering.every((count) => count === 0)).toBe(true)
  expect(nodeStart).toHaveBeenCalledTimes(1)
})
