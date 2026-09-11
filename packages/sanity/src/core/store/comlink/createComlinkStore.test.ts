import {createNode} from '@sanity/comlink'
import {beforeEach, expect, it, vi} from 'vitest'

import {createComlinkStore} from './createComlinkStore'

const nodeStart = vi.fn(() => vi.fn())
vi.mock('@sanity/comlink', () => ({
  createNode: vi.fn(() => ({start: nodeStart})),
}))

beforeEach(() => {
  vi.mocked(createNode).mockClear()
  nodeStart.mockClear()
})

it('creates the node without starting it, and starts it once on demand', () => {
  const store = createComlinkStore({capabilities: {comlink: true}})

  expect(createNode).toHaveBeenCalledTimes(1)
  expect(store.node).toBeDefined()
  expect(nodeStart).not.toHaveBeenCalled()

  // every consumer asks for a start; the node is only started once
  store.start()
  store.start()
  expect(nodeStart).toHaveBeenCalledTimes(1)
})

it('creates no node when the rendering context does not provide comlink', () => {
  const store = createComlinkStore({capabilities: {}})

  expect(createNode).not.toHaveBeenCalled()
  expect(store.node).toBeUndefined()
  expect(() => store.start()).not.toThrow()
})
