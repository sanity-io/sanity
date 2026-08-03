import {type SchemaType} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {useSchema} from '../../../hooks/useSchema'
import {type DocumentPreviewStore} from '../../../preview/documentPreviewStore'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useWorkspace} from '../../../studio/workspace'
import {useNotificationTarget} from '../useNotificationTarget'

vi.mock('../../../hooks/useSchema', () => ({
  useSchema: vi.fn(),
}))

vi.mock('../../../studio/workspace', () => ({
  useWorkspace: vi.fn(),
}))

vi.mock('../../../store/datastores', () => ({
  useDocumentPreviewStore: vi.fn(),
}))

const mockUseSchema = useSchema as Mock<typeof useSchema>
const mockUseWorkspace = useWorkspace as Mock<typeof useWorkspace>
const mockUseDocumentPreviewStore = useDocumentPreviewStore as Mock<typeof useDocumentPreviewStore>

const mockSchemaType = {
  name: 'article',
  type: 'document',
} as unknown as SchemaType

describe('useNotificationTarget', () => {
  let previewSubjects: Subject<{snapshot: {title?: string} | null}>[]
  let observeForPreview: Mock

  beforeEach(() => {
    previewSubjects = []
    observeForPreview = vi.fn(() => {
      const subject = new Subject<{snapshot: {title?: string} | null}>()
      previewSubjects.push(subject)
      return subject.asObservable()
    })

    mockUseSchema.mockReturnValue({
      get: vi.fn().mockReturnValue(mockSchemaType),
    } as unknown as ReturnType<typeof useSchema>)

    mockUseWorkspace.mockReturnValue({
      title: 'My Workspace',
      name: 'default',
    } as unknown as ReturnType<typeof useWorkspace>)

    mockUseDocumentPreviewStore.mockReturnValue({
      observeForPreview,
    } as unknown as DocumentPreviewStore)
  })

  it('does not subscribe to preview until getNotificationValue is called', () => {
    renderHook(() =>
      useNotificationTarget({
        documentId: 'doc-1',
        documentType: 'article',
      }),
    )

    expect(observeForPreview).not.toHaveBeenCalled()
    expect(previewSubjects).toHaveLength(0)
  })

  it('resolves the document title from the preview snapshot', async () => {
    const getCommentLink = vi.fn((commentId: string) => `https://example.com/comment/${commentId}`)

    const {result} = renderHook(() =>
      useNotificationTarget({
        documentId: 'doc-1',
        documentType: 'article',
        getCommentLink,
      }),
    )

    const notificationPromise = result.current.getNotificationValue({commentId: 'comment-1'})

    expect(observeForPreview).toHaveBeenCalled()
    expect(previewSubjects.length).toBeGreaterThan(0)

    // getPreviewStateObservable combines perspective + version/drafts snapshots.
    // Emit a title on every active subject so combineLatest can produce a value.
    for (const subject of previewSubjects) {
      subject.next({snapshot: {title: 'Hello World'}})
    }

    await expect(notificationPromise).resolves.toEqual({
      documentTitle: 'Hello World',
      url: 'https://example.com/comment/comment-1',
      workspaceTitle: 'My Workspace',
      workspaceName: 'default',
    })
    expect(getCommentLink).toHaveBeenCalledWith('comment-1')
  })

  it('falls back to Sanity document when schema type is missing', async () => {
    mockUseSchema.mockReturnValue({
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ReturnType<typeof useSchema>)

    const {result} = renderHook(() =>
      useNotificationTarget({
        documentId: 'doc-1',
        documentType: 'missing',
      }),
    )

    await expect(result.current.getNotificationValue({commentId: 'comment-1'})).resolves.toEqual({
      documentTitle: 'Sanity document',
      url: undefined,
      workspaceTitle: 'My Workspace',
      workspaceName: 'default',
    })
    expect(observeForPreview).not.toHaveBeenCalled()
  })

  it('falls back to Sanity document when document id is empty', async () => {
    const {result} = renderHook(() =>
      useNotificationTarget({
        documentId: '',
        documentType: 'article',
      }),
    )

    await expect(result.current.getNotificationValue({commentId: 'comment-1'})).resolves.toEqual({
      documentTitle: 'Sanity document',
      url: undefined,
      workspaceTitle: 'My Workspace',
      workspaceName: 'default',
    })
    expect(observeForPreview).not.toHaveBeenCalled()
  })
})
