import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {act, Suspense} from 'react'
import {CommentsEnabledContext, CommentsModePromiseContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type CommentsMode} from '../../../context/enabled/types'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import CommentsInspector from '../CommentsInspector'

const onClose = vi.fn()

async function renderInspector(modePromise: Promise<CommentsMode>, enabled = true) {
  const wrapper = await createTestProvider({resources: [commentsUsEnglishLocaleBundle]})
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the inspector suspends on the mode promise; React only resumes it inside an awaited act
  await act(async () => {
    render(
      <CommentsEnabledContext value={enabled}>
        <CommentsModePromiseContext value={modePromise}>
          {/* Stands in for DocumentInspectorPanel's boundary */}
          <Suspense fallback={<span data-testid="inspector-pending" />}>
            <CommentsInspector documentId="doc" documentType="article" onClose={onClose} />
          </Suspense>
        </CommentsModePromiseContext>
      </CommentsEnabledContext>,
      {wrapper},
    )
  })
}

describe('CommentsInspector', () => {
  it('waits inside the inspector panel boundary while the feature check is pending', async () => {
    let settle!: (mode: CommentsMode) => void
    const modePromise = new Promise<CommentsMode>((resolve) => {
      settle = resolve
    })
    await renderInspector(modePromise)

    expect(screen.getByTestId('inspector-pending')).toBeInTheDocument()
    expect(screen.queryByText('Comments are unavailable right now. Try again later.')).toBeNull()

    await act(async () => settle(null))

    expect(
      await screen.findByText('Comments are unavailable right now. Try again later.'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('inspector-pending')).toBeNull()
  })

  it('reads as unavailable when the feature check failed, but can still be closed', async () => {
    // The config still enables comments, so the menu item that opens the panel is visible; a
    // failed check leaves the plan unknown, so the panel fails closed and says so
    await renderInspector(Promise.resolve<CommentsMode>(null))

    expect(
      await screen.findByText('Comments are unavailable right now. Try again later.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Comments'})).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', {name: 'Close comments'}))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when the config disables comments', async () => {
    await renderInspector(Promise.resolve<CommentsMode>('default'), false)

    expect(screen.queryByRole('heading', {name: 'Comments'})).toBeNull()
    expect(screen.queryByTestId('inspector-pending')).toBeNull()
  })

  it('neither waits for the feature check nor needs its provider when comments are disabled', async () => {
    const wrapper = await createTestProvider({resources: [commentsUsEnglishLocaleBundle]})
    // No `CommentsModePromiseContext`: the config boolean is read first, so a disabled document
    // never reaches the mode promise
    render(
      <CommentsEnabledContext value={false}>
        <Suspense fallback={<span data-testid="inspector-pending" />}>
          <CommentsInspector documentId="doc" documentType="article" onClose={onClose} />
        </Suspense>
      </CommentsEnabledContext>,
      {wrapper},
    )

    expect(screen.queryByRole('heading', {name: 'Comments'})).toBeNull()
    expect(screen.queryByTestId('inspector-pending')).toBeNull()
  })
})
