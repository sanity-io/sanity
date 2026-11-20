import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {Observable, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useUpsellContext} from '../../../hooks/useUpsellContext'
import {useUpsellData} from '../../../hooks/useUpsellData'
import {type UpsellData, type UpsellDataResult} from '../types'
import {UpsellPanel} from '../UpsellPanel'

// `createTestProvider` mocks the `useUpsellData` module; the observable it returns is set per test
const useUpsellDataMock = vi.mocked(useUpsellData)

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

const upsellData: UpsellData = {
  _createdAt: '2024-01-01',
  _id: 'journey-test',
  _rev: '1',
  _type: 'journey',
  _updatedAt: '2024-01-01',
  id: 'journey-test',
  image: null,
  descriptionText: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 'a1', text: 'Upgrade to unlock this feature', marks: []}],
    },
  ],
  ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/manage'},
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}

let response$: Subject<UpsellDataResult>
let subscriptions: number

beforeEach(() => {
  response$ = new Subject<UpsellDataResult>()
  subscriptions = 0
  // Stands in for the request: pending until `response$` emits. Stable, like the real hook's
  // memoized observable, so react-rx keeps one cache entry for it
  const upsellData$ = new Observable<UpsellDataResult>((subscriber) => {
    subscriptions++
    return response$.subscribe(subscriber)
  })
  useUpsellDataMock.mockReturnValue({upsellData$, telemetryLogs})
})

/** A provider that does not preload, as for a plan that already has the feature */
function Harness() {
  const upsell = useUpsellContext({dataUri: '/journey/test', feature: 'test', preLoadData: false})
  return <UpsellPanel upsell={upsell} unavailable={<p data-testid="unavailable">Unavailable</p>} />
}

async function renderHarness() {
  const TestProvider = await createTestProvider()
  // The panel's content suspends on mount; React only commits that inside an awaited act
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- see the comment above
  await act(async () => {
    render(<Harness />, {wrapper: TestProvider})
  })
}

function answer(result: UpsellDataResult) {
  return act(async () => {
    response$.next(result)
    response$.complete()
  })
}

describe('UpsellPanel', () => {
  it('starts the content request itself, and shows a loading state until it answers', async () => {
    await renderHarness()

    expect(subscriptions).toBe(1)
    expect(screen.getByTestId('loading-block')).toBeInTheDocument()

    await answer({upsellData, hasError: false})

    expect(screen.getByText('Upgrade to unlock this feature')).toBeInTheDocument()
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', {name: 'Upgrade plan'}))
    expect(telemetryLogs.panelPrimaryClicked).toHaveBeenCalledTimes(1)
  })

  it('renders unavailable when the content cannot be loaded', async () => {
    await renderHarness()
    await answer({upsellData: null, hasError: true})

    expect(screen.getByTestId('unavailable')).toBeInTheDocument()
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
})
