import {render, screen} from '@testing-library/react'
import {act, Suspense} from 'react'
import {
  HasUsedScheduledPublishingPromiseContext,
  ScheduledPublishingModePromiseContext,
} from 'sanity/_singletons'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type ScheduledPublishingMode} from '../../../scheduledPublishing/contexts/types'
import Tool from '../Tool'

function settled<T>(value: T) {
  return Object.assign(Promise.resolve(value), {status: 'fulfilled' as const, value})
}

// The same routes the plugin declares for the tool
const toolRouter = route.create('/', [
  route.intents('/intent'),
  route.create('/state/:state'),
  route.create('/date/:date'),
])

async function renderTool(routerState: Record<string, unknown>) {
  const TestProvider = await createTestProvider()
  const onNavigate = vi.fn()

  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the tool reads the mode with `use()`
  await act(async () => {
    render(
      <TestProvider>
        <RouterProvider router={toolRouter} state={routerState} onNavigate={onNavigate}>
          <ScheduledPublishingModePromiseContext
            value={settled<ScheduledPublishingMode>('default')}
          >
            <HasUsedScheduledPublishingPromiseContext value={settled(true)}>
              <Suspense fallback={null}>
                <Tool />
              </Suspense>
            </HasUsedScheduledPublishingPromiseContext>
          </ScheduledPublishingModePromiseContext>
        </RouterProvider>
      </TestProvider>,
    )
  })

  return {onNavigate}
}

describe('scheduled publishing tool', () => {
  test('renders a known schedule state from the url', async () => {
    const {onNavigate} = await renderTool({state: 'succeeded'})

    expect(screen.getAllByText(/Completed/).length).toBeGreaterThan(0)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  test('falls back to the first filter for an unknown schedule state in the url', async () => {
    const {onNavigate} = await renderTool({state: 'not-a-schedule-state'})

    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({path: '/state/scheduled'}))
  })

  test('falls back to the first filter for a date in the url that does not parse', async () => {
    const {onNavigate} = await renderTool({date: 'not-a-date'})

    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({path: '/state/scheduled'}))
  })
})
