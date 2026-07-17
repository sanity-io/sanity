import {render} from '@testing-library/react'
import {getTargetScopeId, usePerspective} from 'sanity'
import {type Mock, beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaneRouter} from '../../../../components'
import {useDocumentPane} from '../../useDocumentPane'
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
  getTargetScopeId: vi.fn(() => undefined),
  useCommentsEnabled: vi.fn(() => ({enabled: true})),
  usePerspective: vi.fn(() => ({
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    selectedVariantName: undefined,
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
    targetDocumentState: {status: 'ready', scopeId: undefined},
  })),
}))

const mockUsePerspective = usePerspective as Mock
const mockUsePaneRouter = usePaneRouter as Mock
const mockUseDocumentPane = useDocumentPane as Mock
const mockGetTargetScopeId = getTargetScopeId as Mock

describe('CommentsWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedCommentsProviderProps = undefined

    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: undefined,
      selectedReleaseId: undefined,
      selectedVariantName: undefined,
      selectedPerspective: 'drafts',
      perspectiveStack: ['drafts'],
      excludedPerspectives: [],
    })

    mockUsePaneRouter.mockReturnValue({
      params: {},
      setParams: vi.fn(),
    })

    mockUseDocumentPane.mockReturnValue({
      connectionState: 'connected',
      onPathOpen: vi.fn(),
      inspector: null,
      openInspector: vi.fn(),
      targetDocumentState: {status: 'ready', scopeId: undefined},
    })

    mockGetTargetScopeId.mockReturnValue(undefined)
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
        selectedVariantName: undefined,
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

    it('passes variant search param when a variant is selected', () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: undefined,
        selectedReleaseId: undefined,
        selectedVariantName: 'alpha-audience',
        selectedPerspective: 'drafts',
        perspectiveStack: ['drafts'],
        excludedPerspectives: [],
      })

      render(
        <CommentsWrapper documentId="doc-variant" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      const getCommentLink = capturedCommentsProviderProps!.getCommentLink as (id: string) => string

      getCommentLink('comment-variant')

      expect(mockResolveIntentLink).toHaveBeenCalledOnce()
      expect(mockResolveIntentLink.mock.calls[0][1]).toEqual({
        id: 'doc-variant',
        type: 'article',
        inspect: 'sanity/comments',
        comment: 'comment-variant',
      })
      expect(mockResolveIntentLink.mock.calls[0][2]).toEqual([['variant', 'alpha-audience']])
    })

    it('passes both perspective and variant search params for a release with a variant', () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rSomeRelease',
        selectedReleaseId: 'rSomeRelease',
        selectedVariantName: 'alpha-audience',
        selectedPerspective: 'rSomeRelease',
        perspectiveStack: ['rSomeRelease', 'drafts'],
        excludedPerspectives: [],
      })

      render(
        <CommentsWrapper documentId="doc-both" documentType="post">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      const getCommentLink = capturedCommentsProviderProps!.getCommentLink as (id: string) => string

      getCommentLink('comment-both')

      expect(mockResolveIntentLink).toHaveBeenCalledOnce()
      expect(mockResolveIntentLink.mock.calls[0][2]).toEqual([
        ['perspective', 'rSomeRelease'],
        ['variant', 'alpha-audience'],
      ])
    })

    it('passes scheduledDraft as intent param (not perspective search param) for scheduled drafts', () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rScheduledDraft',
        selectedReleaseId: 'rScheduledDraft',
        selectedVariantName: undefined,
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

  describe('releaseId (scopeId)', () => {
    it('passes the scopeId from getTargetScopeId as releaseId to CommentsProvider', () => {
      const targetDocumentState = {
        status: 'ready' as const,
        scopeId: 'varscope',
        targetDocument: undefined,
        variant: undefined,
        publishedSibling: undefined,
      }

      mockUseDocumentPane.mockReturnValue({
        connectionState: 'connected',
        onPathOpen: vi.fn(),
        inspector: null,
        openInspector: vi.fn(),
        targetDocumentState,
      })
      mockGetTargetScopeId.mockReturnValue('varscope')

      render(
        <CommentsWrapper documentId="doc-scoped" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(mockGetTargetScopeId).toHaveBeenCalledWith(targetDocumentState)
      expect(capturedCommentsProviderProps?.releaseId).toBe('varscope')
    })

    it('passes undefined releaseId when the target document is still resolving', () => {
      const targetDocumentState = {status: 'resolving' as const}

      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rSomeRelease',
        selectedReleaseId: 'rSomeRelease',
        selectedVariantName: 'alpha-audience',
        selectedPerspective: 'rSomeRelease',
        perspectiveStack: ['rSomeRelease', 'drafts'],
        excludedPerspectives: [],
      })
      mockUseDocumentPane.mockReturnValue({
        connectionState: 'connected',
        onPathOpen: vi.fn(),
        inspector: null,
        openInspector: vi.fn(),
        targetDocumentState,
      })
      mockGetTargetScopeId.mockReturnValue(undefined)

      render(
        <CommentsWrapper documentId="doc-resolving" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(mockGetTargetScopeId).toHaveBeenCalledWith(targetDocumentState)
      // Must not fall back to selectedReleaseId while the variant/release target is unresolved.
      expect(capturedCommentsProviderProps?.releaseId).toBeUndefined()
    })

    it('uses variant scopeId rather than the release id when a variant is selected', () => {
      mockUsePerspective.mockReturnValue({
        selectedPerspectiveName: 'rSomeRelease',
        selectedReleaseId: 'rSomeRelease',
        selectedVariantName: 'alpha-audience',
        selectedPerspective: 'rSomeRelease',
        perspectiveStack: ['rSomeRelease', 'drafts'],
        excludedPerspectives: [],
      })

      const targetDocumentState = {
        status: 'ready' as const,
        scopeId: 'varscope',
        targetDocument: undefined,
        variant: {_id: 'system.variant.alpha-audience', name: 'alpha-audience'},
        publishedSibling: undefined,
      }

      mockUseDocumentPane.mockReturnValue({
        connectionState: 'connected',
        onPathOpen: vi.fn(),
        inspector: null,
        openInspector: vi.fn(),
        targetDocumentState,
      })
      // Variant stubs carry an opaque scope hash, not the release id.
      mockGetTargetScopeId.mockReturnValue('varscope')

      render(
        <CommentsWrapper documentId="doc-variant-scope" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps?.releaseId).toBe('varscope')
      expect(capturedCommentsProviderProps?.releaseId).not.toBe('rSomeRelease')
    })
  })
})
