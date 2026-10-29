import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {Suspense} from 'react'
import {Observable, Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {type UpsellData, type UpsellDataResult} from '../../studio/upsell/types'
import {UpsellContextDialog} from '../../studio/upsell/UpsellContextDialog'
import {useUpsellContext} from '../useUpsellContext'
import {useUpsellData} from '../useUpsellData'

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
let upsellData$: Observable<UpsellDataResult>
let subscriptions: number

beforeEach(() => {
  response$ = new Subject<UpsellDataResult>()
  subscriptions = 0
  // Stands in for the request: pending until `response$` emits. Stable, like the real hook's
  // memoized observable, so react-rx keeps one cache entry for it
  upsellData$ = new Observable<UpsellDataResult>((subscriber) => {
    subscriptions++
    return response$.subscribe(subscriber)
  })
  useUpsellDataMock.mockReturnValue({upsellData$, telemetryLogs})
})

function Harness() {
  const contextValue = useUpsellContext({dataUri: '/journey/test', feature: 'test'})
  return (
    <>
      <button type="button" onClick={() => contextValue.handleOpenDialog('navbar')}>
        open
      </button>
      <div data-testid="open-state">{String(contextValue.upsellDialogOpen)}</div>
      <Suspense fallback={<div data-testid="dialog-pending" />}>
        <UpsellContextDialog contextValue={contextValue} />
      </Suspense>
    </>
  )
}

async function renderHarness() {
  const TestProvider = await createTestProvider()
  render(<Harness />, {wrapper: TestProvider})
}

function answer(result: UpsellDataResult) {
  return act(async () => {
    response$.next(result)
    response$.complete()
  })
}

describe('useUpsellContext', () => {
  it('starts the request once when the provider commits, without waiting for a consumer', async () => {
    await renderHarness()

    // The promise for the leaves and the preload in the effect share one react-rx cache entry
    expect(subscriptions).toBe(1)
    expect(screen.queryByTestId('dialog-pending')).not.toBeInTheDocument()
  })

  it('opens the dialog with the content once the request has answered, and closes it again', async () => {
    await renderHarness()
    await answer({upsellData, hasError: false})

    // Closed: nothing rendered, nothing waited for
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dialog-pending')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', {name: 'open'}))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Upgrade to unlock this feature')
    expect(screen.getByTestId('open-state')).toHaveTextContent('true')
    expect(telemetryLogs.dialogViewed).toHaveBeenCalledWith('navbar')
    expect(screen.getByRole('link', {name: 'Upgrade plan'})).toHaveAttribute(
      'href',
      'https://www.sanity.io/manage',
    )

    await userEvent.click(screen.getByRole('link', {name: 'Upgrade plan'}))
    expect(telemetryLogs.dialogPrimaryClicked).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('link', {name: 'Learn more'}))
    expect(telemetryLogs.dialogSecondaryClicked).toHaveBeenCalledTimes(1)

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('open-state')).toHaveTextContent('false')
    expect(telemetryLogs.dialogDismissed).toHaveBeenCalledTimes(1)
  })

  it('opens at once when the request is still pending, and the dialog waits for the content under its own boundary', async () => {
    await renderHarness()

    // A render that suspends only resumes when it happened inside an awaited act (see AGENTS.md)
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the dialog leaf suspends on the click
    await act(async () => {
      await userEvent.click(screen.getByRole('button', {name: 'open'}))
    })

    // The open state is set synchronously; only the dialog leaf suspends, nothing is awaited
    expect(screen.getByTestId('open-state')).toHaveTextContent('true')
    expect(screen.getByTestId('dialog-pending')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(telemetryLogs.dialogViewed).toHaveBeenCalledWith('navbar')

    await answer({upsellData, hasError: false})

    expect(await screen.findByRole('dialog')).toHaveTextContent('Upgrade to unlock this feature')
    expect(screen.queryByTestId('dialog-pending')).not.toBeInTheDocument()
  })

  it('reports a failed request with a toast and closes the dialog again', async () => {
    await renderHarness()
    await answer({upsellData: null, hasError: true})

    await userEvent.click(screen.getByRole('button', {name: 'open'}))

    // The dialog leaf reads the failed result and closes itself; nothing stays open empty
    expect(await screen.findByText('Unable to perform this action')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('open-state')).toHaveTextContent('false')
    expect(telemetryLogs.dialogDismissed).toHaveBeenCalledTimes(1)
  })
})
