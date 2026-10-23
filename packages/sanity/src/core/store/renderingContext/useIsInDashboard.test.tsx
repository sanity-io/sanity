import {renderHook} from '@testing-library/react'
import {beforeEach, expect, it, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {useRenderingContextStore} from '../datastores'
import {createRenderingContextStore} from './createRenderingContextStore'
import {isDashboardRenderingContext, useIsInDashboard} from './useIsInDashboard'

vi.mock('../datastores')

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

beforeEach(() => {
  vi.clearAllMocks()
})

it('is false for a standalone studio', () => {
  vi.mocked(useRenderingContextStore).mockReturnValue(createRenderingContextStore(''))

  const {result} = renderHook(() => useIsInDashboard())

  expect(result.current).toBe(false)
})

it("is true inside the dashboard's core ui frame", () => {
  vi.mocked(useRenderingContextStore).mockReturnValue(createRenderingContextStore(CORE_UI_SEARCH))

  const {result} = renderHook(() => useIsInDashboard())

  expect(result.current).toBe(true)
})

it('is true inside a message bus host such as the workbench', () => {
  stubMessageBusHost()
  vi.mocked(useRenderingContextStore).mockReturnValue(createRenderingContextStore(''))

  const {result} = renderHook(() => useIsInDashboard())

  expect(result.current).toBe(true)
})

it('treats an unresolved rendering context as outside the dashboard', () => {
  expect(isDashboardRenderingContext(undefined)).toBe(false)
  expect(isDashboardRenderingContext({name: 'default', metadata: {}})).toBe(false)
  expect(isDashboardRenderingContext({name: 'coreUi', metadata: {environment: 'test'}})).toBe(true)
})
