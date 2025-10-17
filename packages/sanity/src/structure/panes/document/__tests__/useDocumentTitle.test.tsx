import {renderHook, waitFor} from '@testing-library/react'
import {
  defineConfig,
  prepareForPreview,
  type SanityClient,
  unstable_useValuePreview as useValuePreview,
} from 'sanity'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentPaneContextValue} from '../DocumentPaneContext'
import {useDocumentPane} from '../useDocumentPane'
import {useDocumentTitle} from '../useDocumentTitle'

// Mock the useDocumentPane hook
vi.mock('../useDocumentPane')

// Mock the useValuePreview, useTranslation, and usePerspective hooks
vi.mock('sanity', async (importOriginal) => {
  const original = (await importOriginal()) as any
  const {usePerspectiveMockReturn} = await import('../../../__mocks__/usePerspective.mock')
  return {
    ...original,
    unstable_useValuePreview: vi.fn(),
    prepareForPreview: vi.fn(),
    usePerspective: vi.fn(() => usePerspectiveMockReturn),
  }
})

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
const mockUseValuePreview = useValuePreview as MockedFunction<typeof useValuePreview>
const mockPrepareForPreview = prepareForPreview as MockedFunction<typeof prepareForPreview>

function createWrapperComponent(client: SanityClient) {
  const config = defineConfig({
    projectId: 'test',
    dataset: 'test',
  })

  return createTestProvider({
    client,
    config,
    resources: [structureUsEnglishLocaleBundle],
  })
}

describe('useDocumentTitle', () => {
  const defaultDocumentPaneValue = {
    connectionState: 'connected' as const,
    schemaType: {title: 'Test Schema', name: 'testSchema', jsonType: 'object', fields: []},
    editState: {
      id: 'test-id',
      type: 'testSchema',
      transactionSyncLock: {enabled: false},
      liveEdit: {enabled: false},
      draft: {
        _id: 'test-id',
        _type: 'testSchema',
        _createdAt: '2023-01-01T00:00:00Z',
        _updatedAt: '2023-01-01T00:00:00Z',
        _rev: 'rev1',
        title: 'Test Document',
      },
      published: {
        _id: 'test-id',
        _type: 'testSchema',
        _createdAt: '2023-01-01T00:00:00Z',
        _updatedAt: '2023-01-01T00:00:00Z',
        _rev: 'rev1',
        title: 'Test Document',
      },
      version: undefined,
      patches: [],
      historyController: {} as any,
    },
  } as unknown as DocumentPaneContextValue

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDocumentPane.mockReturnValue(defaultDocumentPaneValue as DocumentPaneContextValue)
    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: {title: 'Test Document'},
      isLoading: false,
    })
  })

  it('should return title when document value exists and preview is successful', async () => {
    const {result} = renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'Test Document',
      })
    })
  })

  it('should return "New {schemaType.title}" when no document value exists', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      editState: null,
    } as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: undefined,
      isLoading: false,
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {result} = renderHook(() => useDocumentTitle(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'New Test Schema',
      })
    })
  })

  it('should return "New {schemaType.name}" when schemaType has no title', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      schemaType: {name: 'testSchema'}, // No title
      editState: null,
    } as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: undefined,
      isLoading: false,
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)
    const {result} = renderHook(() => useDocumentTitle(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'New testSchema',
      })
    })
  })

  it('should return error when preview fails', async () => {
    mockUseValuePreview.mockReturnValue({
      error: new Error('Preview failed'),
      value: {
        _id: 'drafts.test-id',
        title: 'Test Document',
        _createdAt: '2023-01-01T00:00:00Z',
        _updatedAt: '2023-01-01T00:00:00Z',
      },
      isLoading: false,
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)
    const {result} = renderHook(() => useDocumentTitle(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        error: 'Encountered an error while fetching documents.',
        title: undefined,
      })
    })
  })

  it('should return undefined title and error when connecting and not subscribed', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      connectionState: 'connecting',
      editState: null,
    } as DocumentPaneContextValue)

    const {result} = renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: undefined,
      })
    })
  })

  it('should use version over draft over published for document value', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      editState: {
        id: 'test-id',
        type: 'testSchema',
        transactionSyncLock: {enabled: false},
        liveEdit: {enabled: false},
        version: {
          _id: 'versions.release1.test-id',
          _type: 'testSchema',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev1',
          title: 'Version Title',
        },
        draft: {
          _id: 'drafts.test-id',
          _type: 'testSchema',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev1',
          title: 'Draft Title',
        },
        published: {
          _id: 'test-id',
          _type: 'testSchema',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev1',
          title: 'Published Title',
        },
        patches: [],
        historyController: {} as any,
      },
    } as unknown as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: {title: 'Version Title'},
      isLoading: false,
    })

    const client = createMockSanityClient()

    const {result} = renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'Version Title',
      })
    })

    // Verify that useValuePreview was called with the version value
    expect(mockUseValuePreview).toHaveBeenCalledWith({
      enabled: true,
      schemaType: {title: 'Test Schema', fields: [], jsonType: 'object', name: 'testSchema'},
      value: {
        _id: 'versions.release1.test-id',
        _type: 'testSchema',
        title: 'Version Title',
        _createdAt: '2023-01-01T00:00:00Z',
        _updatedAt: '2023-01-01T00:00:00Z',
        _rev: 'rev1',
      },
    })
  })

  it('should use draft when version is not available', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      editState: {
        id: 'test-id',
        type: 'testSchema',
        transactionSyncLock: {enabled: false},
        liveEdit: {enabled: false},
        version: undefined,
        draft: {
          _id: 'drafts.test-id',
          _type: 'testSchema',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev1',
          title: 'Draft Title',
        },
        published: {
          _id: 'test-id',
          _type: 'testSchema',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev1',
          title: 'Published Title',
        },
        patches: [],
        historyController: {} as any,
      },
    } as unknown as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: {title: 'Draft Title'},
      isLoading: false,
    })

    const {result} = renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'Draft Title',
      })
    })

    // Verify that useValuePreview was called with the draft value
    expect(mockUseValuePreview).toHaveBeenCalledWith({
      enabled: true,
      schemaType: {title: 'Test Schema', name: 'testSchema', fields: [], jsonType: 'object'},
      value: {
        _id: 'drafts.test-id',
        _type: 'testSchema',
        title: 'Draft Title',
        _createdAt: '2023-01-01T00:00:00Z',
        _updatedAt: '2023-01-01T00:00:00Z',
        _rev: 'rev1',
      },
    })
  })

  it('should use published when version and draft are not available', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      editState: {
        id: 'test-id',
        type: 'testSchema',
        transactionSyncLock: {enabled: false},
        liveEdit: {enabled: false},
        version: undefined,
        draft: undefined,
        published: {
          _id: 'test-id',
          _type: 'testSchema',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev1',
          title: 'Published Title',
        },
        patches: [],
        historyController: {} as any,
      },
    } as unknown as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: {title: 'Published Title'},
      isLoading: false,
    })

    const {result} = renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'Published Title',
      })
    })

    // Verify that useValuePreview was called with the published value
    expect(mockUseValuePreview).toHaveBeenCalledWith({
      enabled: true,
      schemaType: {title: 'Test Schema', name: 'testSchema', fields: [], jsonType: 'object'},
      value: {
        _id: 'test-id',
        _type: 'testSchema',
        title: 'Published Title',
        _createdAt: '2023-01-01T00:00:00Z',
        _updatedAt: '2023-01-01T00:00:00Z',
        _rev: 'rev1',
      },
    })
  })

  it('should disable preview when no document value is available', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      editState: null,
    } as DocumentPaneContextValue)

    renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(mockUseValuePreview).toHaveBeenCalledWith({
        enabled: false,
        schemaType: {title: 'Test Schema', name: 'testSchema', fields: [], jsonType: 'object'},
        value: undefined,
      })
    })
  })

  it('should enable preview when document value is available', async () => {
    renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(mockUseValuePreview).toHaveBeenCalledWith({
        enabled: true,
        schemaType: {title: 'Test Schema', name: 'testSchema', fields: [], jsonType: 'object'},
        value: {
          _id: 'test-id',
          _type: 'testSchema',
          title: 'Test Document',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev1',
        },
      })
    })
  })

  it('should handle reconnecting state with document value', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      connectionState: 'reconnecting',
    } as DocumentPaneContextValue)

    const {result} = renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'Test Document',
      })
    })
  })

  it('should handle empty editState with connecting state', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      connectionState: 'connecting',
      editState: null,
    } as DocumentPaneContextValue)

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {result} = renderHook(() => useDocumentTitle(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: undefined,
      })
    })
  })

  it('should handle empty editState with non-connecting state', async () => {
    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      connectionState: 'connected',
      editState: null,
    } as DocumentPaneContextValue)

    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: undefined,
      isLoading: false,
    })

    const {result} = renderHook(() => useDocumentTitle())

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'New Test Schema',
      })
    })
  })

  it('should handle deleted documents by using prepareForPreview directly', async () => {
    const lastRevisionDocument = {
      _id: 'test-id',
      _type: 'testSchema',
      _createdAt: '2023-01-01T00:00:00Z',
      _updatedAt: '2023-01-01T00:00:00Z',
      _rev: 'rev1',
      title: 'Deleted Document Title',
    }

    mockUseDocumentPane.mockReturnValue({
      ...defaultDocumentPaneValue,
      isDeleted: true,
      lastRevisionDocument,
      editState: null, // No edit state for deleted documents
    } as DocumentPaneContextValue)

    // Mock prepareForPreview to return the expected title
    mockPrepareForPreview.mockReturnValue({
      title: 'Deleted Document Title',
    })

    // useValuePreview should not be called for deleted documents
    mockUseValuePreview.mockReturnValue({
      error: undefined,
      value: undefined,
      isLoading: false,
    })

    const client = createMockSanityClient()
    const wrapper = await createWrapperComponent(client as any)

    const {result} = renderHook(() => useDocumentTitle(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        error: undefined,
        title: 'Deleted Document Title',
      })
    })

    // Verify that prepareForPreview was called with the lastRevisionDocument
    expect(mockPrepareForPreview).toHaveBeenCalledWith(lastRevisionDocument, {
      title: 'Test Schema',
      name: 'testSchema',
      jsonType: 'object',
      fields: [],
    })

    // Verify that useValuePreview was called with enabled: false for deleted documents
    expect(mockUseValuePreview).toHaveBeenCalledWith({
      enabled: false,
      schemaType: {title: 'Test Schema', name: 'testSchema', fields: [], jsonType: 'object'},
      value: lastRevisionDocument,
    })
  })
})
