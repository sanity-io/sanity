import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {Suspense} from 'react'
import {preloadObservablePromise} from 'react-rx'
import {of, Subject} from 'rxjs'
import {CommentsModePromiseContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useUpsellData} from '../../../../hooks/useUpsellData'
import {type UpsellData, type UpsellDataResult} from '../../../../studio/upsell/types'
import {type CommentsMode} from '../../../context/enabled/types'
import {useCommentsUpsell} from '../../../hooks/useCommentsUpsell'
import {CommentsStudioLayout} from '../CommentsStudioLayout'

/**
 * The layout renders the same tree in both plan modes, so the comments mode (the plan check the
 * plugin's provider publishes through `CommentsModePromiseContext`) is read only by the upsell
 * dialog at the leaf: the layout and its children never wait for it.
 */

// `createTestProvider` mocks the `useUpsellData` module; the observable it returns is set per test
const useUpsellDataMock = vi.mocked(useUpsellData)

const upsellData: UpsellData = {
  _createdAt: '2024-01-01',
  _id: 'journey-comments',
  _rev: '1',
  _type: 'journey',
  _updatedAt: '2024-01-01',
  id: 'journey-comments',
  image: null,
  descriptionText: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 'a1', text: 'Comments need a bigger plan', marks: []}],
    },
  ],
  ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/manage'},
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}
const settledUpsellData: UpsellDataResult = {upsellData, hasError: false}

let mode$: Subject<CommentsMode>
const onChildRender = vi.fn()
// Answers as soon as the provider commits, so the only thing the dialog could wait for is the
// mode promise. Module-scoped like the real hook's memoized observable
const upsellData$ = of(settledUpsellData)

beforeEach(() => {
  mode$ = new Subject<CommentsMode>()
  useUpsellDataMock.mockReturnValue({
    upsellData$,
    telemetryLogs: {
      dialogViewed: vi.fn(),
      dialogDismissed: vi.fn(),
      dialogPrimaryClicked: vi.fn(),
      dialogSecondaryClicked: vi.fn(),
      panelViewed: vi.fn(),
      panelDismissed: vi.fn(),
      panelPrimaryClicked: vi.fn(),
      panelSecondaryClicked: vi.fn(),
    },
  })
})

// Stands in for the studio below the layout; asks for the upsell dialog the way the comments UI
// does once it knows it is in upsell mode
function StudioBelowLayout() {
  onChildRender()
  const {handleOpenDialog, upsellDialogOpen} = useCommentsUpsell()
  return (
    <>
      <button type="button" onClick={() => handleOpenDialog('document_action')}>
        open upsell
      </button>
      <div data-testid="open-state">{String(upsellDialogOpen)}</div>
    </>
  )
}

async function renderLayout() {
  const TestProvider = await createTestProvider()
  const modePromise = preloadObservablePromise(mode$.asObservable())
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the dialog leaf suspends on the feature check during mount; React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    render(
      <TestProvider>
        <CommentsModePromiseContext value={modePromise}>
          {/* Stands in for StudioLayout's loading screen boundary: shown if the layout suspends */}
          <Suspense fallback={<div data-testid="studio-loading" />}>
            <CommentsStudioLayout renderDefault={() => <StudioBelowLayout />} />
          </Suspense>
        </CommentsModePromiseContext>
      </TestProvider>,
    )
  })
}

function settleMode(mode: CommentsMode) {
  return act(async () => {
    mode$.next(mode)
    mode$.complete()
  })
}

describe('CommentsStudioLayout', () => {
  it('renders the studio below it before the feature check has answered', async () => {
    await renderLayout()

    expect(screen.getByRole('button', {name: 'open upsell'})).toBeInTheDocument()
    expect(screen.queryByTestId('studio-loading')).not.toBeInTheDocument()
    expect(onChildRender).toHaveBeenCalledTimes(1)
  })

  it('does not re-render the studio below it when the feature check answers', async () => {
    await renderLayout()
    const rendersBeforeAnswer = onChildRender.mock.calls.length

    await settleMode('default')

    expect(screen.getByRole('button', {name: 'open upsell'})).toBeInTheDocument()
    expect(onChildRender).toHaveBeenCalledTimes(rendersBeforeAnswer)
  })

  it('opens the upsell dialog on a plan without comments', async () => {
    await renderLayout()
    await settleMode('upsell')

    await userEvent.click(screen.getByRole('button', {name: 'open upsell'}))

    expect(await screen.findByRole('dialog')).toHaveTextContent('Comments need a bigger plan')
  })

  it('never shows the upsell dialog on a plan with comments, whatever asks for it', async () => {
    await renderLayout()
    await settleMode('default')

    await userEvent.click(screen.getByRole('button', {name: 'open upsell'}))

    // The context did open; the leaf that knows about the plan is what drops the dialog
    expect(await screen.findByTestId('open-state')).toHaveTextContent('true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('never shows the upsell dialog when the feature check failed', async () => {
    await renderLayout()
    await settleMode(null)

    await userEvent.click(screen.getByRole('button', {name: 'open upsell'}))

    expect(await screen.findByTestId('open-state')).toHaveTextContent('true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('holds the dialog, not the studio, while the feature check is still pending', async () => {
    await renderLayout()

    // The click opens the dialog at once, and its leaf suspends on the mode: a render that suspends
    // only resumes when it happened inside an awaited act (see AGENTS.md)
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the dialog leaf suspends on the click
    await act(async () => {
      await userEvent.click(screen.getByRole('button', {name: 'open upsell'}))
    })

    // The dialog leaf waits inside its own boundary; the studio below the layout is unaffected
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'open upsell'})).toBeInTheDocument()
    expect(screen.queryByTestId('studio-loading')).not.toBeInTheDocument()

    await settleMode('upsell')

    expect(await screen.findByRole('dialog')).toHaveTextContent('Comments need a bigger plan')
  })
})
