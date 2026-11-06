import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {preloadObservablePromise} from 'react-rx'
import {Observable, of, Subject} from 'rxjs'
import {TasksModePromiseContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useUpsellData} from '../../../hooks/useUpsellData'
import {type UpsellData, type UpsellDataResult} from '../../../studio/upsell/types'
import {type TasksMode} from '../enabled/types'
import {TasksUpsellProvider} from './TasksUpsellProvider'
import {useTasksUpsell} from './useTasksUpsell'

/**
 * The provider is mounted in both plan modes by `TasksStudioLayout`, so it only requests the
 * upsell content once the plan check it reads through `TasksModePromiseContext` has settled as
 * upsell; a plan that has tasks, or a failed check, never requests it.
 */

// `createTestProvider` mocks the `useUpsellData` module; the observable it returns is set per test
const useUpsellDataMock = vi.mocked(useUpsellData)

const upsellData: UpsellData = {
  _createdAt: '2024-01-01',
  _id: 'journey-tasks',
  _rev: '1',
  _type: 'journey',
  _updatedAt: '2024-01-01',
  id: 'journey-tasks',
  image: null,
  descriptionText: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 'a1', text: 'Tasks need a bigger plan', marks: []}],
    },
  ],
  ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/manage'},
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}
const settledUpsellData: UpsellDataResult = {upsellData, hasError: false}

let mode$: Subject<TasksMode>
// Answers as soon as it is requested, and counts its requests. Module-scoped like the real
// hook's memoized observable
let upsellRequests = 0
const upsellData$ = new Observable<UpsellDataResult>((subscriber) => {
  upsellRequests++
  subscriber.next(settledUpsellData)
  subscriber.complete()
})
// What the test provider's own upsell providers (limits, releases) get: never counted
const otherUpsellData$ = of<UpsellDataResult>({upsellData: null, hasError: false})
const telemetryLogs = {
  dialogViewed: vi.fn(),
  dialogDismissed: vi.fn(),
  dialogPrimaryClicked: vi.fn(),
  dialogSecondaryClicked: vi.fn(),
  panelViewed: vi.fn(),
  panelDismissed: vi.fn(),
  panelPrimaryClicked: vi.fn(),
  panelSecondaryClicked: vi.fn(),
}

beforeEach(() => {
  mode$ = new Subject<TasksMode>()
  upsellRequests = 0
  useUpsellDataMock.mockImplementation(({dataUri}) => ({
    upsellData$: dataUri === '/journey/tasks' ? upsellData$ : otherUpsellData$,
    telemetryLogs,
  }))
})

// Asks for the dialog the way the tasks UI does once it knows it is in upsell mode
function Opener() {
  const {handleOpenDialog} = useTasksUpsell()
  return (
    <button type="button" onClick={() => handleOpenDialog('navbar')}>
      open upsell
    </button>
  )
}

async function renderProvider() {
  const TestProvider = await createTestProvider()
  const modePromise = preloadObservablePromise(mode$.asObservable())
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the dialog leaf suspends on the plan check during mount; React only resumes it inside an awaited act
  await act(async () => {
    render(
      <TestProvider>
        <TasksModePromiseContext value={modePromise}>
          <TasksUpsellProvider>
            <Opener />
          </TasksUpsellProvider>
        </TasksModePromiseContext>
      </TestProvider>,
    )
  })
}

function settleMode(mode: TasksMode) {
  return act(async () => {
    mode$.next(mode)
    mode$.complete()
  })
}

describe('TasksUpsellProvider', () => {
  it('requests the upsell content only once the plan check has settled as upsell, and shows the dialog with it', async () => {
    await renderProvider()

    expect(upsellRequests).toBe(0)

    await settleMode('upsell')

    expect(upsellRequests).toBe(1)

    await userEvent.click(screen.getByRole('button', {name: 'open upsell'}))

    expect(await screen.findByRole('dialog')).toHaveTextContent('Tasks need a bigger plan')
  })

  it('never requests the upsell content on a plan that has tasks', async () => {
    await renderProvider()
    await settleMode('default')

    await userEvent.click(screen.getByRole('button', {name: 'open upsell'}))

    // Nothing to show on this plan, and nothing was fetched for it
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(upsellRequests).toBe(0)
  })

  it('never requests the upsell content when the feature check failed', async () => {
    await renderProvider()
    await settleMode(null)

    expect(upsellRequests).toBe(0)
  })
})
