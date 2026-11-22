import {createSanityInstance} from '@sanity/sdk'
import {getOrCreateNode} from '@sanity/sdk/comlink'
import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, expect, it, onTestFinished, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {canvasUsEnglishLocaleBundle} from '../i18n'
import {useCanvasNavigate} from '../useCanvasNavigate'

// The Dashboard's `_context` param, read when the rendering context module loads.
vi.hoisted(() => {
  window.history.replaceState(
    null,
    '',
    `?_context=${encodeURIComponent(JSON.stringify({mode: 'core-ui', env: 'test'}))}`,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function renderCanvas() {
  const TestProvider = await createTestProvider({resources: [canvasUsEnglishLocaleBundle]})
  return renderHook(() => useCanvasNavigate(), {wrapper: TestProvider})
}

it('hides "Link to Canvas" over Comlink when the Dashboard says Canvas is unlisted', async () => {
  // Comlink needs Studio to be rendered in a frame.
  vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  const node = getOrCreateNode(createSanityInstance(), {
    name: 'dashboard/nodes/sdk',
    connectTo: 'dashboard/channels/sdk',
  })
  const fetch = vi.spyOn(node, 'fetch').mockResolvedValue({context: {canvasVisibility: 'unlisted'}})
  const {result} = await renderCanvas()

  // Wait for the call, then flush a macrotask so the reply has certainly settled: the
  // settled answer and the closed starting point carry the same value.
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('dashboard/v1/context', undefined))
  await new Promise((resolve) => setTimeout(resolve, 0))
  await waitFor(() => expect(result.current.canLink).toBe(false))
  // "Edit in Canvas" gates on `isAvailable` only and must keep working.
  expect(result.current.isAvailable).toBe(true)
})

it('keeps "Link to Canvas" when the Dashboard omits canvasVisibility (older Dashboards)', async () => {
  vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  const node = getOrCreateNode(createSanityInstance(), {
    name: 'dashboard/nodes/sdk',
    connectTo: 'dashboard/channels/sdk',
  })
  vi.spyOn(node, 'fetch').mockResolvedValue({context: {organizationId: 'org-1'}})
  const {result} = await renderCanvas()

  await waitFor(() => expect(result.current.canLink).toBe(true))
})

it('fails closed on a Comlink timeout: no "Link to Canvas", "Edit in Canvas" unaffected', async () => {
  vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  const node = getOrCreateNode(createSanityInstance(), {
    name: 'dashboard/nodes/sdk',
    connectTo: 'dashboard/channels/sdk',
  })
  vi.spyOn(node, 'fetch').mockReturnValue(new Promise(() => {}))
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const TestProvider = await createTestProvider({resources: [canvasUsEnglishLocaleBundle]})
  // Fake timers only from here: `createTestProvider` above needs real ones.
  vi.useFakeTimers()
  onTestFinished(() => {
    vi.useRealTimers()
  })

  const {result} = renderHook(() => useCanvasNavigate(), {wrapper: TestProvider})
  // Fail-closed from the start: `canLink` never flashes for a pending reply.
  expect(result.current.canLink).toBe(false)

  await act(() => vi.advanceTimersByTimeAsync(2999))
  expect(result.current.canLink).toBe(false)

  await act(() => vi.advanceTimersByTimeAsync(1))
  // The timeout fails closed too, and `isAvailable` is untouched by it.
  expect(result.current.canLink).toBe(false)
  expect(result.current.isAvailable).toBe(true)
  expect(error).toHaveBeenCalled()
})

it('fails closed on a Comlink error, with "Edit in Canvas" unaffected', async () => {
  vi.spyOn(window, 'top', 'get').mockReturnValue(null)
  const node = getOrCreateNode(createSanityInstance(), {
    name: 'dashboard/nodes/sdk',
    connectTo: 'dashboard/channels/sdk',
  })
  const fetch = vi.spyOn(node, 'fetch').mockRejectedValue(new Error('no dashboard'))
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const {result} = await renderCanvas()

  // Wait for the call, then flush a macrotask so the rejection has certainly settled: the
  // settled answer and the closed starting point carry the same value.
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('dashboard/v1/context', undefined))
  await new Promise((resolve) => setTimeout(resolve, 0))
  await waitFor(() => expect(result.current.canLink).toBe(false))
  expect(result.current.isAvailable).toBe(true)
  expect(error).toHaveBeenCalledWith(
    'Failed to read Canvas visibility from the Dashboard context',
    expect.any(Error),
  )
})

it('standalone: does not ask a Dashboard about visibility', async () => {
  const node = getOrCreateNode(createSanityInstance(), {
    name: 'dashboard/nodes/sdk',
    connectTo: 'dashboard/channels/sdk',
  })
  const fetch = vi.spyOn(node, 'fetch')
  const {result} = await renderCanvas()

  await waitFor(() => expect(result.current.canLink).toBe(true))
  expect(fetch).not.toHaveBeenCalled()
})
