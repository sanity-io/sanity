import {render} from '@testing-library/react'
import {getTargetScopeId, usePerspective, useWorkspace} from 'sanity'
import {type Mock, beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {useDocumentPane} from '../../useDocumentPane'
import {CommentsWrapper} from '../CommentsWrapper'

const mockResolveIntentLink = vi.hoisted(() => vi.fn(() => '/mock-intent-link'))

let capturedCommentsProviderProps: Record<string, unknown> | undefined
let capturedCommentsProviderV2Props: Record<string, unknown> | undefined

vi.mock('sanity', async () => {
  // Use the real id helpers so the derived target reflects production behaviour.
  const {
    getDraftId: draftId,
    getPublishedId: publishedId,
    getVersionId: versionId,
  } = await import('@sanity/client/csm')

  return {
    COMMENTS_INSPECTOR_NAME: 'sanity/comments',
    CommentsEnabledProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
    CommentsProvider: (props: Record<string, unknown>) => {
      capturedCommentsProviderProps = props
      return <>{props.children}</>
    },
    CommentsProviderV2: (props: Record<string, unknown>) => {
      capturedCommentsProviderV2Props = props
      return <>{props.children}</>
    },
    getDraftId: draftId,
    getPublishedId: publishedId,
    getVersionId: versionId,
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
    useWorkspace: vi.fn(() => ({
      beta: {comments: {v2: false}},
    })),
  }
})

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({
    state: {},
    resolveIntentLink: mockResolveIntentLink,
  })),
}))

vi.mock('../../../../components/paneRouter/usePaneRouter', () => ({
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
    value: {_id: 'doc-1'},
  })),
}))

const mockUsePerspective = usePerspective as Mock
const mockUsePaneRouter = usePaneRouter as Mock
const mockUseDocumentPane = useDocumentPane as Mock
const mockGetTargetScopeId = getTargetScopeId as Mock
const mockUseWorkspace = useWorkspace as Mock

function documentPane(overrides: Record<string, unknown> = {}) {
  return {
    connectionState: 'connected',
    onPathOpen: vi.fn(),
    inspector: null,
    openInspector: vi.fn(),
    targetDocumentState: {status: 'ready', scopeId: undefined},
    value: {_id: 'doc-1'},
    ...overrides,
  }
}

function draftsPerspective(overrides: Record<string, unknown> = {}) {
  return {
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    selectedVariantName: undefined,
    selectedPerspective: 'drafts',
    perspectiveStack: ['drafts'],
    excludedPerspectives: [],
    ...overrides,
  }
}

describe('CommentsWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedCommentsProviderProps = undefined
    capturedCommentsProviderV2Props = undefined

    mockUseWorkspace.mockReturnValue({
      beta: {comments: {v2: false}},
    })

    mockUsePerspective.mockReturnValue(draftsPerspective())

    mockUsePaneRouter.mockReturnValue({
      params: {},
      setParams: vi.fn(),
    })

    mockUseDocumentPane.mockReturnValue(documentPane())

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
      // @ts-expect-error -- pre-existing, fix later
      expect(mockResolveIntentLink.mock.calls[0][0]).toBe('edit')
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
      expect(mockResolveIntentLink.mock.calls[0][0]).toBe('edit')
      // @ts-expect-error -- pre-existing, fix later
      expect(mockResolveIntentLink.mock.calls[0][1]).toEqual({
        id: 'doc-456',
        type: 'post',
        inspect: 'sanity/comments',
        comment: 'comment-xyz',
      })
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
      expect(mockResolveIntentLink.mock.calls[0][1]).toEqual({
        id: 'doc-variant',
        type: 'article',
        inspect: 'sanity/comments',
        comment: 'comment-variant',
      })
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
      expect(mockResolveIntentLink.mock.calls[0][1]).toEqual({
        id: 'doc-scheduled',
        type: 'article',
        inspect: 'sanity/comments',
        comment: 'comment-scheduled',
        scheduledDraft: 'rScheduledDraft',
      })
      // @ts-expect-error -- pre-existing, fix later
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
      // @ts-expect-error -- pre-existing, fix later
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

      mockUseDocumentPane.mockReturnValue(documentPane({targetDocumentState}))
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

      mockUsePerspective.mockReturnValue(
        draftsPerspective({
          selectedPerspectiveName: 'rSomeRelease',
          selectedReleaseId: 'rSomeRelease',
          selectedVariantName: 'alpha-audience',
          selectedPerspective: 'rSomeRelease',
          perspectiveStack: ['rSomeRelease', 'drafts'],
        }),
      )
      mockUseDocumentPane.mockReturnValue(documentPane({targetDocumentState}))
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
      mockUsePerspective.mockReturnValue(
        draftsPerspective({
          selectedPerspectiveName: 'rSomeRelease',
          selectedReleaseId: 'rSomeRelease',
          selectedVariantName: 'alpha-audience',
          selectedPerspective: 'rSomeRelease',
          perspectiveStack: ['rSomeRelease', 'drafts'],
        }),
      )

      const targetDocumentState = {
        status: 'ready' as const,
        scopeId: 'varscope',
        targetDocument: undefined,
        variant: {_id: 'system.variant.alpha-audience', name: 'alpha-audience'},
        publishedSibling: undefined,
      }

      mockUseDocumentPane.mockReturnValue(documentPane({targetDocumentState}))
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

  describe('beta.comments.v2', () => {
    it('does not mount the v2 provider when the flag is off', () => {
      render(
        <CommentsWrapper documentId="doc-default" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeDefined()
      expect(capturedCommentsProviderV2Props).toBeUndefined()
      expect(capturedCommentsProviderProps).not.toHaveProperty('sourceDocumentId')
    })

    it('mounts the v2 provider with sourceDocumentId when the flag is on', () => {
      mockUseWorkspace.mockReturnValue({
        beta: {comments: {v2: true}},
      })
      mockUseDocumentPane.mockReturnValue(documentPane({value: {_id: 'drafts.doc-v2'}}))

      render(
        <CommentsWrapper documentId="doc-v2" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )

      expect(capturedCommentsProviderProps).toBeUndefined()
      expect(capturedCommentsProviderV2Props?.sourceDocumentId).toBe('drafts.doc-v2')
      expect(capturedCommentsProviderV2Props).not.toHaveProperty('releaseId')
    })
  })

  describe('sourceDocumentId (v2)', () => {
    beforeEach(() => {
      mockUseWorkspace.mockReturnValue({beta: {comments: {v2: true}}})
    })

    function renderWrapper() {
      render(
        <CommentsWrapper documentId="doc-1" documentType="article">
          <div>children</div>
        </CommentsWrapper>,
      )
      return capturedCommentsProviderV2Props?.sourceDocumentId
    }

    it('targets the draft in the drafts perspective before the draft exists', () => {
      // The pane still reports the published id until the first edit creates the draft. Comments
      // made now belong to the draft, so they keep their range as the draft is edited.
      mockUseDocumentPane.mockReturnValue(documentPane({value: {_id: 'doc-1'}}))

      expect(renderWrapper()).toBe('drafts.doc-1')
    })

    it('targets the draft in the drafts perspective once the draft exists', () => {
      mockUseDocumentPane.mockReturnValue(documentPane({value: {_id: 'drafts.doc-1'}}))

      expect(renderWrapper()).toBe('drafts.doc-1')
    })

    it('targets the published document in the published perspective', () => {
      mockUsePerspective.mockReturnValue(
        draftsPerspective({selectedPerspectiveName: 'published', selectedPerspective: 'published'}),
      )
      mockUseDocumentPane.mockReturnValue(documentPane({value: {_id: 'doc-1'}}))

      expect(renderWrapper()).toBe('doc-1')
    })

    it('normalises a draft id to the published id in the published perspective', () => {
      mockUsePerspective.mockReturnValue(
        draftsPerspective({selectedPerspectiveName: 'published', selectedPerspective: 'published'}),
      )
      mockUseDocumentPane.mockReturnValue(documentPane({value: {_id: 'drafts.doc-1'}}))

      expect(renderWrapper()).toBe('doc-1')
    })

    it('targets the release version id before the version document exists', () => {
      // Same idea as drafts: `versions.<releaseId>.<id>` is deterministic, so comments made while
      // still viewing the draft/published pair under a release perspective belong to that version.
      mockUsePerspective.mockReturnValue(
        draftsPerspective({
          selectedPerspectiveName: 'rSomeRelease',
          selectedReleaseId: 'rSomeRelease',
          selectedPerspective: 'rSomeRelease',
          perspectiveStack: ['rSomeRelease', 'drafts'],
        }),
      )
      mockUseDocumentPane.mockReturnValue(documentPane({value: {_id: 'doc-1'}}))

      expect(renderWrapper()).toBe('versions.rSomeRelease.doc-1')
    })

    it('targets the release version id once the version exists', () => {
      mockUsePerspective.mockReturnValue(
        draftsPerspective({
          selectedPerspectiveName: 'rSomeRelease',
          selectedReleaseId: 'rSomeRelease',
          selectedPerspective: 'rSomeRelease',
          perspectiveStack: ['rSomeRelease', 'drafts'],
        }),
      )
      mockUseDocumentPane.mockReturnValue(
        documentPane({value: {_id: 'versions.rSomeRelease.doc-1'}}),
      )

      expect(renderWrapper()).toBe('versions.rSomeRelease.doc-1')
    })

    it('uses the resolved document id for a variant, rather than deriving a draft', () => {
      // Variant scopes are opaque and server-assigned; deriving `drafts.doc-1` here would file the
      // comment against the base pair instead of the variant document on screen.
      mockUsePerspective.mockReturnValue(draftsPerspective({selectedVariantName: 'alpha-audience'}))
      mockUseDocumentPane.mockReturnValue(documentPane({value: {_id: 'versions.varscope.doc-1'}}))

      expect(renderWrapper()).toBe('versions.varscope.doc-1')
    })
  })
})
