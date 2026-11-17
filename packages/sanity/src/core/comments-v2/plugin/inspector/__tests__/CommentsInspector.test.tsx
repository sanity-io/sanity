import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {act, type ReactNode, Suspense} from 'react'
import {
  AddonDatasetContext,
  CommentsContextV2,
  CommentsEnabledContext,
  CommentsModePromiseContext,
  CommentsOnboardingContextV2,
  CommentsSelectedPathContextV2,
} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type AddonDatasetContextValue} from '../../../../studio/addonDataset/types'
import {type CommentsContextValue} from '../../../context/comments/types'
import {type CommentsMode} from '../../../context/enabled/types'
import {type CommentsOnboardingContextValue} from '../../../context/onboarding/types'
import {type CommentsSelectedPathContextValue} from '../../../context/selected-path/types'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {type CommentDocument, type CommentStatus, type CommentsUIMode} from '../../../types'
import CommentsInspector from '../CommentsInspector'

// The list and the header render the status; what reaches them is what the inspector decided
vi.mock('../../../components/list/CommentsList', () => ({
  CommentsList: ({status}: {status: CommentStatus}) => (
    <div data-testid="comments-list" data-status={status} />
  ),
}))
vi.mock('../CommentsInspectorHeader', () => ({
  CommentsInspectorHeader: ({view}: {view: CommentStatus}) => (
    <div data-testid="inspector-header" data-view={view} />
  ),
}))

const onClose = vi.fn()

async function renderInspector(modePromise: Promise<CommentsMode> | null, enabled = true) {
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

const resolvedComment: CommentDocument = {
  _type: 'sanity.comment',
  _id: 'comment-1',
  _rev: '1',
  _createdAt: '2024-01-01T00:00:00Z',
  _system: {createdBy: 'user-1'},
  message: null,
  threadId: 'thread-1',
  status: 'resolved',
  reactions: null,
  target: {
    sourceDocumentId: 'doc',
    documentType: 'article',
    document: {_ref: 'dataset:production:doc', _type: 'globalDocumentReference', _weak: true},
    path: {field: 'title'},
  },
}

const addonDataset: AddonDatasetContextValue = {
  client: null,
  isCreatingDataset: false,
  createAddonDataset: () => Promise.resolve(null),
  ready: true,
  error: null,
}
const onboarding: CommentsOnboardingContextValue = {isDismissed: true, setDismissed: vi.fn()}
const selectedPath: CommentsSelectedPathContextValue = {
  selectedPath: null,
  setSelectedPath: vi.fn(),
}

function commentsValue(
  status: CommentStatus,
  overrides: Partial<CommentsContextValue> = {},
): CommentsContextValue {
  return {
    groupId: 'doc',
    documentType: 'article',
    versionId: 'doc',
    getComment: () => undefined,
    readOnly: false,
    comments: {data: {open: [], resolved: []}, error: null, loading: false},
    operation: {
      create: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      updateRange: vi.fn(),
      react: vi.fn(),
    },
    mentionOptions: {data: [], error: null, loading: false},
    status,
    setStatus: vi.fn(),
    ...overrides,
  }
}

/** The inspector as `CommentsProvider` and the plugin's layout render it, in `mode` */
async function renderInspectorWith(mode: CommentsUIMode, comments: CommentsContextValue) {
  const wrapper = await createTestProvider({resources: [commentsUsEnglishLocaleBundle]})
  function Providers({children}: {children: ReactNode}) {
    return (
      <AddonDatasetContext value={addonDataset}>
        <CommentsOnboardingContextV2 value={onboarding}>
          <CommentsSelectedPathContextV2 value={selectedPath}>
            <CommentsContextV2 value={comments}>{children}</CommentsContextV2>
          </CommentsSelectedPathContextV2>
        </CommentsOnboardingContextV2>
      </AddonDatasetContext>
    )
  }
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the inspector suspends on the mode promise; React only resumes it inside an awaited act
  await act(async () => {
    render(
      <CommentsEnabledContext value>
        <CommentsModePromiseContext value={Promise.resolve<CommentsMode>(mode)}>
          <Suspense fallback={<span data-testid="inspector-pending" />}>
            <Providers>
              <CommentsInspector documentId="doc" documentType="article" onClose={onClose} />
            </Providers>
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

  it('renders nothing when the config disables comments, without touching the plan check', async () => {
    // No mode promise at all: a disabled document neither waits for the check nor needs the
    // plugin's provider (a `?inspect=` link can still ask for the inspector)
    await renderInspector(null, false)

    expect(screen.queryByRole('heading', {name: 'Comments'})).toBeNull()
    expect(screen.queryByTestId('inspector-pending')).toBeNull()
  })

  it('shows the resolved view in default mode when the status is resolved', async () => {
    await renderInspectorWith('default', commentsValue('resolved'))

    expect(screen.getByTestId('inspector-header')).toHaveAttribute('data-view', 'resolved')
    expect(screen.getByTestId('comments-list')).toHaveAttribute('data-status', 'resolved')
  })

  it('shows the open view in upsell mode whatever set the status to resolved', async () => {
    // The resolved view is not available in upsell mode; the guard used to live in
    // `CommentsProvider.setStatus`, which only covered status changes that went through it
    await renderInspectorWith('upsell', commentsValue('resolved'))

    expect(screen.getByTestId('inspector-header')).toHaveAttribute('data-view', 'open')
    expect(screen.getByTestId('comments-list')).toHaveAttribute('data-status', 'open')
  })

  it('keeps a link to a resolved comment on the open view in upsell mode', async () => {
    // A `?comment=` link sets the status to the linked comment's own before scrolling to it
    const setStatus = vi.fn()
    const linked = {
      getComment: (id: string) => (id === resolvedComment._id ? resolvedComment : undefined),
      selectedCommentId: resolvedComment._id,
      setStatus,
    }

    await renderInspectorWith('default', commentsValue('open', linked))
    expect(setStatus).toHaveBeenCalledWith('resolved')

    setStatus.mockClear()
    await renderInspectorWith('upsell', commentsValue('open', linked))
    expect(setStatus).toHaveBeenCalledWith('open')
    expect(setStatus).not.toHaveBeenCalledWith('resolved')
  })
})
