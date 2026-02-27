import {render} from '@testing-library/react'
import {usePerspective} from 'sanity'
import {type Mock, beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaneRouter} from '../../../../components'
import {CommentsWrapper} from '../CommentsWrapper'

const mockResolveIntentLink = vi.hoisted(() => vi.fn(() => '/mock-intent-link'))

let capturedCommentsProviderProps: Record<string, unknown> | undefined

vi.mock('sanity', () => ({
  COMMENTS_INSPECTOR_NAME: 'sanity/comments',
  CommentsEnabledProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  CommentsProvider: (props: Record<string, unknown>) => {
    capturedCommentsProviderProps = props
    return <>{props.children}</>
  },
  useCommentsEnabled: vi.fn(() => ({enabled: true})),
  usePerspective: vi.fn(() => ({
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    selectedPerspective: 'drafts',
    perspectiveStack: ['drafts'],
    excludedPerspectives: [],
  })),
}))

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({
    state: {},
    resolveIntentLink: mockResolveIntentLink,
  })),
}))

vi.mock('../../../../components', () => ({
  usePaneRouter: vi.fn(() => ({
    params: {},
    setParams: vi.fn(),
  })),
}))

vi.mock('../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(() => ({
    connectionState: 'connected',
    onPathOpen: vi.fn(),
    inspector: null,
    openInspector: vi.fn(),
  })),
}))

const mockUsePerspective = usePerspective as Mock
const mockUsePaneRouter = usePaneRouter as Mock

describe('CommentsWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedCommentsProviderProps = undefined

    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: undefined,
      selectedReleaseId: undefined,
      selectedPerspective: 'drafts',
      perspectiveStack: ['drafts'],
      excludedPerspectives: [],
    })
  })

  describe('getCommentLink', () => {
    it('calls resolveIntentLink with correct intent params for regular drafts', () => {
      render(
        <CommentsWrapper documentId="doc-123" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      const getCommentLink = capturedCommentsProviderProps!.getCommentLink as (id: string) => string

      getCommentLink('comment-abc')

      expect(mockResolveIntentLink).toHaveBeenCalledOnce()
      expect(mockResolveIntentLink.mock.calls[0][0]).toBe('edit')
      expect(mockResolveIntentLink.mock.calls[0][1]).toEqual({
        id: 'doc-123',
        type: 'article',
        inspect: 'sanity/comments',
        comment: 'comment-abc',
      })
    })

    it('passes perspective search param for content releases (non-scheduled)', () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rSomeRelease',
        selectedReleaseId: 'rSomeRelease',
        selectedPerspective: 'rSomeRelease',
        perspectiveStack: ['rSomeRelease', 'drafts'],
        excludedPerspectives: [],
      })

      render(
        <CommentsWrapper documentId="doc-456" documentType="post">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      const getCommentLink = capturedCommentsProviderProps!.getCommentLink as (id: string) => string

      getCommentLink('comment-xyz')

      expect(mockResolveIntentLink).toHaveBeenCalledOnce()
      expect(mockResolveIntentLink.mock.calls[0][0]).toBe('edit')
      expect(mockResolveIntentLink.mock.calls[0][1]).toEqual({
        id: 'doc-456',
        type: 'post',
        inspect: 'sanity/comments',
        comment: 'comment-xyz',
      })
      expect(mockResolveIntentLink.mock.calls[0][2]).toEqual([['perspective', 'rSomeRelease']])
    })

    it('passes scheduledDraft as intent param (not perspective search param) for scheduled drafts', () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rScheduledDraft',
        selectedReleaseId: 'rScheduledDraft',
        selectedPerspective: 'rScheduledDraft',
        perspectiveStack: ['rScheduledDraft', 'drafts'],
        excludedPerspectives: [],
      })

      mockUsePaneRouter.mockReturnValue({
        params: {scheduledDraft: 'rScheduledDraft'},
        setParams: vi.fn(),
      })

      render(
        <CommentsWrapper documentId="doc-scheduled" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      const getCommentLink = capturedCommentsProviderProps!.getCommentLink as (id: string) => string

      getCommentLink('comment-scheduled')

      expect(mockResolveIntentLink).toHaveBeenCalledOnce()
      expect(mockResolveIntentLink.mock.calls[0][1]).toEqual({
        id: 'doc-scheduled',
        type: 'article',
        inspect: 'sanity/comments',
        comment: 'comment-scheduled',
        scheduledDraft: 'rScheduledDraft',
      })
      expect(mockResolveIntentLink.mock.calls[0][2]).toEqual([])
    })

    it('passes empty search params to resolveIntentLink when no release is selected', () => {
      render(
        <CommentsWrapper documentId="doc-draft" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      const getCommentLink = capturedCommentsProviderProps!.getCommentLink as (id: string) => string

      getCommentLink('comment-draft')

      expect(mockResolveIntentLink).toHaveBeenCalledOnce()
      expect(mockResolveIntentLink.mock.calls[0][2]).toEqual([])
    })

    it('returns a URL combining window.location.origin with the resolved intent link', () => {
      mockResolveIntentLink.mockReturnValue('/intent/edit/id=doc-789;type=page')

      render(
        <CommentsWrapper documentId="doc-789" documentType="page">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      const getCommentLink = capturedCommentsProviderProps!.getCommentLink as (id: string) => string

      const result = getCommentLink('comment-123')

      expect(result).toBe(`${window.location.origin}/intent/edit/id=doc-789;type=page`)
    })
  })
})
